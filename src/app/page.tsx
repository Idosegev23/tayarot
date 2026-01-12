import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Users, Building2, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-primary">
      <div className="min-h-screen bg-black/5 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Agent Mary
            </h1>
            <p className="text-xl text-white/90">
              Empowering tourism through authentic content creation
            </p>
          </div>

          {/* Demo Access Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <div className="bg-light/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Guide Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage and approve tourist posts
              </p>
              <SecondaryButton size="sm" fullWidth disabled>
                Requires Access Key
              </SecondaryButton>
            </Card>

            <Card className="text-center">
              <div className="bg-light/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-accent" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Tourism Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">
                View all content across guides
              </p>
              <SecondaryButton size="sm" fullWidth disabled>
                Requires Access Key
              </SecondaryButton>
            </Card>

            <Card className="text-center">
              <div className="bg-light/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-warm" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure system & seed data
              </p>
              <SecondaryButton size="sm" fullWidth disabled>
                Requires Access Key
              </SecondaryButton>
            </Card>
          </div>

          {/* Info */}
          <Card className="bg-white/95">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">
                Welcome to Agent Mary Demo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This is a demonstration system. To access dashboards, use the Admin panel to seed demo data and generate access keys.
              </p>
              <p className="text-xs text-gray-500">
                Tourist pages are accessible via /g/[guide-slug] routes
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
