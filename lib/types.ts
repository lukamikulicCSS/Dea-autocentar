import type {
  BodyType,
  Currency,
  Drivetrain,
  FuelType,
  InquiryStatus,
  ReservedDisplay,
  SoldDisplay,
  Transmission,
  VehicleCategory,
  VehicleStatus,
} from "@/lib/vehicles/constants";

export type VehicleImage = {
  id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  sort_order: number;
};

/** Podaci potrebni za karticu vozila u popisu. */
export type VehicleCard = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  variant: string | null;
  category: VehicleCategory;
  status: VehicleStatus;
  price_amount: number | null;
  currency: Currency;
  price_on_request: boolean;
  year: number;
  mileage_km: number;
  fuel_type: FuelType;
  transmission: Transmission;
  power_kw: number | null;
  body_type: BodyType | null;
  arrival_date: string | null;
  arrival_note: string | null;
  is_featured: boolean;
  created_at: string;
  vehicle_images: Pick<VehicleImage, "storage_path" | "width" | "height" | "alt_text" | "sort_order">[];
};

/** Svi javni podaci vozila za stranicu detalja. */
export type VehicleDetail = VehicleCard & {
  engine_displacement_cc: number | null;
  exterior_color: string | null;
  drivetrain: Drivetrain | null;
  doors: number | null;
  seats: number | null;
  description: string | null;
  equipment: string[];
  stock_ref: string | null;
  public_vin: string | null;
  sold_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  is_published: boolean;
  vehicle_images: VehicleImage[];
};

export type SiteSettings = {
  business_name: string;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string | null;
  email: string | null;
  open_24_7: boolean;
  opening_hours: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  viber_number: string | null;
  whatsapp_number: string | null;
  maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  reserved_display: ReservedDisplay;
  sold_display: SoldDisplay;
  default_currency: Currency;
};

export type Inquiry = {
  id: string;
  vehicle_id: string | null;
  vehicle_label: string | null;
  email: string;
  message: string | null;
  status: InquiryStatus;
  is_read: boolean;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  vehicles: { slug: string; title: string } | null;
};
