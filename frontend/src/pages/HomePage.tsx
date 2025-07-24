import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Strategy',
      description: 'Generate comprehensive brand strategies using advanced AI that understands your market and audience.',
    },
    {
      icon: RocketLaunchIcon,
      title: 'Creative Campaigns',
      description: 'Create stunning ad campaigns with AI-generated copy and visuals tailored to your brand voice.',
    },
    {
      icon: ChartBarIcon,
      title: 'Multi-Platform Ready',
      description: 'Export your campaigns to Canva, Meta Ads, and other platforms with one-click integration.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gradient">Bezz AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Brand Strategy
              <span className="block text-gradient">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate comprehensive brand strategies and advertising campaigns in minutes. 
              From brand positioning to creative assets, let AI transform your marketing approach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn btn-primary btn-lg inline-flex items-center"
              >
                Start Creating
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build your brand
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From strategy to execution, our AI-powered platform handles every aspect 
              of your brand development and campaign creation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card text-center group hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your brand strategy?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of brands using AI to create compelling strategies and campaigns.
            </p>
            <Link
              to="/signup"
              className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg inline-flex items-center"
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <span className="text-2xl font-bold text-white">Bezz AI</span>
            <p className="text-gray-400 mt-2">
              © 2024 Bezz AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 