"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";

export type ProviderData = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  logoUrl: string | null;
  categoryId: string;
  categoryName: string;
};

type ProviderCardProps = {
  provider: ProviderData;
  isSuperAdmin: boolean;
  onEdit?: (provider: ProviderData) => void;
  onDelete?: (provider: ProviderData) => void;
};

export function ProviderCard({ provider, isSuperAdmin, onEdit, onDelete }: ProviderCardProps) {
  const location = [provider.city, provider.province].filter(Boolean).join(", ");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {provider.logoUrl ? (
              <Image
                src={provider.logoUrl}
                alt={provider.name}
                width={56}
                height={56}
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <Building2 className="h-7 w-7 text-slate-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {provider.name}
            </h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {provider.categoryName}
            </Badge>
          </div>

          {/* Admin Actions */}
          {isSuperAdmin && (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit?.(provider)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600"
                onClick={() => onDelete?.(provider)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
            {provider.description}
          </p>
        )}

        {/* Contact Details */}
        <div className="mt-4 space-y-2">
          {provider.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a href={`tel:${provider.phone}`} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                {provider.phone}
              </a>
            </div>
          )}
          {provider.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a href={`mailto:${provider.email}`} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate">
                {provider.email}
              </a>
            </div>
          )}
          {provider.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                {provider.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">{location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
