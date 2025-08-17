package services

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"bezz-backend/internal/models"

	"cloud.google.com/go/firestore"
)

// ExportService handles exporting brand assets
type ExportService struct {
	briefService *BrandBriefService
	db           *firestore.Client
}

// NewExportService creates a new export service
func NewExportService(briefService *BrandBriefService, db *firestore.Client) *ExportService {
	return &ExportService{
		briefService: briefService,
		db:           db,
	}
}

// GenerateBatchExport creates a ZIP or PDF export of all brand assets
func (s *ExportService) GenerateBatchExport(ctx context.Context, briefID string, userID string, format string) ([]byte, string, string, error) {
	log.Printf("📦 EXPORT: Starting batch export for brief %s in %s format", briefID, format)

	// Fetch the brief with results
	brief, err := s.getBriefWithValidation(ctx, briefID, userID)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to fetch brief: %w", err)
	}

	// Validate that the brief has results
	if brief.Results == nil {
		return nil, "", "", fmt.Errorf("brief has no results to export")
	}

	switch format {
	case "zip":
		return s.generateZipExport(ctx, brief)
	case "pdf":
		return s.generatePDFExport(ctx, brief)
	default:
		return nil, "", "", fmt.Errorf("unsupported format: %s", format)
	}
}

// generateZipExport creates a ZIP file with all brand assets
func (s *ExportService) generateZipExport(ctx context.Context, brief *models.BrandBrief) ([]byte, string, string, error) {
	log.Printf("📦 EXPORT: Creating ZIP export for %s", brief.CompanyName)

	// Create a buffer to write the ZIP to
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	// Add brand strategy document
	if err := s.addStrategyToZip(zipWriter, brief); err != nil {
		log.Printf("⚠️ EXPORT: Failed to add strategy to ZIP: %v", err)
	}

	// Add brand names document
	if brief.Results.BrandNames != nil && len(brief.Results.BrandNames) > 0 {
		if err := s.addBrandNamesToZip(zipWriter, brief); err != nil {
			log.Printf("⚠️ EXPORT: Failed to add brand names to ZIP: %v", err)
		}
	}

	// Add brand identity (logo and colors)
	if brief.Results.BrandIdentity != nil {
		if err := s.addBrandIdentityToZip(zipWriter, brief); err != nil {
			log.Printf("⚠️ EXPORT: Failed to add brand identity to ZIP: %v", err)
		}
	}

	// Add advertisement assets
	if err := s.addAdsToZip(zipWriter, brief); err != nil {
		log.Printf("⚠️ EXPORT: Failed to add ads to ZIP: %v", err)
	}

	// Add asset list/manifest
	if err := s.addManifestToZip(zipWriter, brief); err != nil {
		log.Printf("⚠️ EXPORT: Failed to add manifest to ZIP: %v", err)
	}

	// Close the ZIP writer
	if err := zipWriter.Close(); err != nil {
		return nil, "", "", fmt.Errorf("failed to close ZIP writer: %w", err)
	}

	filename := fmt.Sprintf("%s-brand-kit-%s.zip",
		strings.ReplaceAll(brief.CompanyName, " ", "-"),
		time.Now().Format("2006-01-02"))

	log.Printf("✅ EXPORT: ZIP export created successfully for %s", brief.CompanyName)
	return buf.Bytes(), "application/zip", filename, nil
}

// generatePDFExport creates a PDF report of the brand strategy
func (s *ExportService) generatePDFExport(ctx context.Context, brief *models.BrandBrief) ([]byte, string, string, error) {
	// For now, return text content as PDF would require additional dependencies
	// This can be enhanced later with proper PDF generation
	content := s.generateStrategyText(brief)

	filename := fmt.Sprintf("%s-brand-strategy-%s.txt",
		strings.ReplaceAll(brief.CompanyName, " ", "-"),
		time.Now().Format("2006-01-02"))

	return []byte(content), "text/plain", filename, nil
}

// getBriefWithValidation fetches and validates brief ownership
func (s *ExportService) getBriefWithValidation(ctx context.Context, briefID string, userID string) (*models.BrandBrief, error) {
	doc, err := s.db.Collection("briefs").Doc(briefID).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("brief not found: %w", err)
	}

	var brief models.BrandBrief
	if err := doc.DataTo(&brief); err != nil {
		return nil, fmt.Errorf("failed to parse brief: %w", err)
	}

	// Validate ownership
	if brief.UserID != userID {
		return nil, fmt.Errorf("access denied: brief belongs to different user")
	}

	return &brief, nil
}

// addStrategyToZip adds the brand strategy document to the ZIP
func (s *ExportService) addStrategyToZip(zipWriter *zip.Writer, brief *models.BrandBrief) error {
	content := s.generateStrategyText(brief)

	file, err := zipWriter.Create("01-Brand-Strategy.txt")
	if err != nil {
		return err
	}

	_, err = file.Write([]byte(content))
	return err
}

// addBrandNamesToZip adds brand name suggestions to the ZIP
func (s *ExportService) addBrandNamesToZip(zipWriter *zip.Writer, brief *models.BrandBrief) error {
	content := fmt.Sprintf(`ALTERNATIVE BRAND NAMES
Company: %s
Generated: %s

`, brief.CompanyName, time.Now().Format("January 2, 2006"))

	for i, suggestion := range brief.Results.BrandNames {
		content += fmt.Sprintf("%d. %s\n   Rationale: %s\n\n", i+1, suggestion.Name, suggestion.Rationale)
	}

	file, err := zipWriter.Create("02-Brand-Name-Suggestions.txt")
	if err != nil {
		return err
	}

	_, err = file.Write([]byte(content))
	return err
}

// addBrandIdentityToZip adds logo concept and color palette to the ZIP
func (s *ExportService) addBrandIdentityToZip(zipWriter *zip.Writer, brief *models.BrandBrief) error {
	identity := brief.Results.BrandIdentity

	// Add logo concept document
	logoContent := fmt.Sprintf(`LOGO CONCEPT
Company: %s
Generated: %s

CONCEPT DESCRIPTION:
%s

COLOR PALETTE:
`, brief.CompanyName, time.Now().Format("January 2, 2006"), identity.LogoConcept)

	for _, color := range identity.ColorPalette {
		logoContent += fmt.Sprintf(`
• %s (%s)
  Hex: %s
  Usage: %s
  Psychology: %s
`, color.Name, color.Usage, color.Hex, strings.Title(color.Usage), color.Psychology)
	}

	file, err := zipWriter.Create("03-Logo-Concept-and-Colors.txt")
	if err != nil {
		return err
	}

	if _, err = file.Write([]byte(logoContent)); err != nil {
		return err
	}

	// Add logo image if available
	if identity.LogoImageURL != "" {
		if err := s.addImageToZip(zipWriter, identity.LogoImageURL, "04-Logo-Concept.jpg"); err != nil {
			log.Printf("⚠️ EXPORT: Failed to add logo image to ZIP: %v", err)
		}
	}

	return nil
}

// addAdsToZip adds advertisement assets to the ZIP
func (s *ExportService) addAdsToZip(zipWriter *zip.Writer, brief *models.BrandBrief) error {
	if len(brief.Results.Ads) == 0 {
		return nil
	}

	// Create ads folder and add each ad
	for i, ad := range brief.Results.Ads {
		// Add ad text content
		adContent := fmt.Sprintf(`ADVERTISEMENT #%d
Company: %s
Generated: %s

TITLE:
%s

HEADLINE:
%s

BODY COPY:
%s

CALL TO ACTION:
%s

PLATFORM:
%s

FORMAT:
%s

IMAGE PROMPT USED:
%s
`, i+1, brief.CompanyName, time.Now().Format("January 2, 2006"),
			ad.Title, ad.Copy.Headline, ad.Copy.Body, ad.Copy.CTA, ad.Platform, ad.Format, ad.ImagePrompt)

		filename := fmt.Sprintf("05-Ads/Ad-%d-Content.txt", i+1)
		file, err := zipWriter.Create(filename)
		if err != nil {
			return err
		}

		if _, err = file.Write([]byte(adContent)); err != nil {
			return err
		}

		// Add ad image if available
		if ad.ImageURL != "" {
			imageFilename := fmt.Sprintf("05-Ads/Ad-%d-Image.jpg", i+1)
			if err := s.addImageToZip(zipWriter, ad.ImageURL, imageFilename); err != nil {
				log.Printf("⚠️ EXPORT: Failed to add ad image %d to ZIP: %v", i+1, err)
			}
		}
	}

	return nil
}

// addManifestToZip adds a manifest file listing all included assets
func (s *ExportService) addManifestToZip(zipWriter *zip.Writer, brief *models.BrandBrief) error {
	manifest := fmt.Sprintf(`BRAND KIT MANIFEST
Company: %s
Generated: %s
Export Date: %s

INCLUDED FILES:
`, brief.CompanyName, brief.CreatedAt.Format("January 2, 2006"), time.Now().Format("January 2, 2006 at 3:04 PM"))

	manifest += "\n📋 STRATEGY & POSITIONING:\n"
	manifest += "• 01-Brand-Strategy.txt - Complete brand strategy document\n"

	if brief.Results.BrandNames != nil && len(brief.Results.BrandNames) > 0 {
		manifest += "\n🏷️ BRAND NAMES:\n"
		manifest += fmt.Sprintf("• 02-Brand-Name-Suggestions.txt - %d alternative brand name options\n", len(brief.Results.BrandNames))
	}

	if brief.Results.BrandIdentity != nil {
		manifest += "\n🎨 VISUAL IDENTITY:\n"
		manifest += "• 03-Logo-Concept-and-Colors.txt - Logo concept and color palette\n"
		if brief.Results.BrandIdentity.LogoImageURL != "" {
			manifest += "• 04-Logo-Concept.jpg - Generated logo concept image\n"
		}
	}

	if len(brief.Results.Ads) > 0 {
		manifest += "\n📢 ADVERTISEMENTS:\n"
		for i := range brief.Results.Ads {
			manifest += fmt.Sprintf("• 05-Ads/Ad-%d-Content.txt - Advertisement copy and details\n", i+1)
			manifest += fmt.Sprintf("• 05-Ads/Ad-%d-Image.jpg - Advertisement image\n", i+1)
		}
	}

	manifest += fmt.Sprintf("\nTOTAL ASSETS: %d files\n", s.countTotalAssets(brief))
	manifest += "\nNOTE: All images are high-resolution and suitable for both digital and print use.\n"

	file, err := zipWriter.Create("00-README.txt")
	if err != nil {
		return err
	}

	_, err = file.Write([]byte(manifest))
	return err
}

// addImageToZip downloads an image and adds it to the ZIP
func (s *ExportService) addImageToZip(zipWriter *zip.Writer, imageURL string, filename string) error {
	// Download the image
	resp, err := http.Get(imageURL)
	if err != nil {
		return fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	// Create file in ZIP
	file, err := zipWriter.Create(filename)
	if err != nil {
		return err
	}

	// Copy image data to ZIP file
	_, err = io.Copy(file, resp.Body)
	return err
}

// generateStrategyText creates a formatted text version of the brand strategy
func (s *ExportService) generateStrategyText(brief *models.BrandBrief) string {
	strategy := brief.Results.Strategy

	content := fmt.Sprintf(`BRAND STRATEGY REPORT
Company: %s
Sector: %s
Generated: %s
Export Date: %s

═══════════════════════════════════════════════════════════════

BRAND POSITIONING
%s

VALUE PROPOSITION
%s
`, brief.CompanyName, brief.Sector, brief.CreatedAt.Format("January 2, 2006"),
		time.Now().Format("January 2, 2006 at 3:04 PM"),
		strategy.Positioning, strategy.ValueProposition)

	// Add tagline if available
	if strategy.Tagline != "" {
		content += fmt.Sprintf(`
BRAND TAGLINE
"%s"
`, strategy.Tagline)
	}

	// Add brand pillars
	content += fmt.Sprintf(`
BRAND PILLARS
%s
`, strings.Join(strategy.BrandPillars, "\n• "))

	// Add messaging framework
	content += fmt.Sprintf(`
MESSAGING FRAMEWORK
Primary Message: %s

Supporting Messages:
%s
`, strategy.MessagingFramework.PrimaryMessage,
		strings.Join(strategy.MessagingFramework.SupportingMessages, "\n• "))

	// Add target segments
	content += "\nTARGET SEGMENTS\n"
	for i, segment := range strategy.TargetSegments {
		content += fmt.Sprintf(`
%d. %s (%s)
   Demographics: %s
   Psychographics: %s
   Pain Points: %s
   Preferred Channels: %s
`, i+1, segment.Name, segment.Role, segment.Demographics, segment.Psychographics,
			strings.Join(segment.PainPoints, ", "), strings.Join(segment.PreferredChannels, ", "))
	}

	// Add tonal guidelines
	content += fmt.Sprintf(`
TONAL GUIDELINES
Voice: %s
Personality: %s

Do's:
%s

Don'ts:
%s
`, strategy.TonalGuidelines.Voice, strings.Join(strategy.TonalGuidelines.Personality, ", "),
		strings.Join(strategy.TonalGuidelines.DoAndDonts.Do, "\n• "),
		strings.Join(strategy.TonalGuidelines.DoAndDonts.Dont, "\n• "))

	return content
}

// countTotalAssets counts the total number of files that will be included
func (s *ExportService) countTotalAssets(brief *models.BrandBrief) int {
	count := 2 // Always include manifest and strategy

	if brief.Results.BrandNames != nil && len(brief.Results.BrandNames) > 0 {
		count++ // Brand names document
	}

	if brief.Results.BrandIdentity != nil {
		count++ // Logo concept document
		if brief.Results.BrandIdentity.LogoImageURL != "" {
			count++ // Logo image
		}
	}

	// Count ad assets (text + image for each ad)
	count += len(brief.Results.Ads) * 2

	return count
}

// GenerateCanvaExport generates Canva-compatible export data
func (s *ExportService) GenerateCanvaExport(ctx context.Context, briefID string, userID string) (*CanvaExportData, error) {
	// Placeholder for Canva integration
	// This would integrate with Canva's API to create pre-populated designs
	return nil, fmt.Errorf("Canva export not yet implemented")
}

// GenerateMetaAdsExport generates Meta Ads Manager compatible export
func (s *ExportService) GenerateMetaAdsExport(ctx context.Context, briefID string, userID string) (*MetaAdsExportData, error) {
	// Placeholder for Meta Ads integration
	// This would format ads for Facebook Ads Manager import
	return nil, fmt.Errorf("Meta Ads export not yet implemented")
}

// Export data structures for future integrations
type CanvaExportData struct {
	DesignURL string         `json:"designUrl"`
	Elements  []CanvaElement `json:"elements"`
	Metadata  ExportMetadata `json:"metadata"`
}

type CanvaElement struct {
	Type    string      `json:"type"` // "text", "image", "shape"
	Content interface{} `json:"content"`
	Style   interface{} `json:"style"`
}

type MetaAdsExportData struct {
	CampaignName   string         `json:"campaignName"`
	AdSets         []MetaAdSet    `json:"adSets"`
	CreativeAssets []MetaCreative `json:"creativeAssets"`
}

type MetaAdSet struct {
	Name           string `json:"name"`
	TargetAudience string `json:"targetAudience"`
	Budget         string `json:"budget"`
	Optimization   string `json:"optimization"`
}

type MetaCreative struct {
	Headline     string `json:"headline"`
	Body         string `json:"body"`
	ImageURL     string `json:"imageUrl"`
	CallToAction string `json:"callToAction"`
}

type ExportMetadata struct {
	CompanyName string    `json:"companyName"`
	ExportDate  time.Time `json:"exportDate"`
	Format      string    `json:"format"`
}
