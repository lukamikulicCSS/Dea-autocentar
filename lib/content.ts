/**
 * Prednosti salona — ISKLJUČIVO tvrdnje koje salon sam navodi na svom
 * službenom OLX profilu (olx.ba/shops/DEAautocentar/onama, provjereno 23.10.2026.).
 * Ne dodavati nove tvrdnje bez potvrde vlasnika.
 */
export const HIGHLIGHTS = [
  {
    title: "Provjerena vozila",
    text: "Prije oglašavanja svako vozilo prolazi detaljan pregled i provjeru tehničke ispravnosti.",
    icon: "shield",
  },
  {
    title: "Probna vožnja",
    text: "Vozilo koje vas zanima možete isprobati prije nego što odlučite.",
    icon: "steering",
  },
  {
    title: "Zamjena uz besplatnu procjenu",
    text: "Vaše dosadašnje vozilo procjenjujemo besplatno i možemo ga uzeti u zamjenu.",
    icon: "repeat",
  },
  {
    title: "Osiguranje i registracija",
    text: "Kompletnu uslugu osiguranja i registracije rješavate na jednom mjestu.",
    icon: "file",
  },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Početna", short: "Početna", icon: "home" },
  { href: "/vozila", label: "Vozila", short: "Vozila", icon: "car" },
  { href: "/premium", label: "Premium vozila", short: "Premium", icon: "gem" },
  { href: "/u-dolasku", label: "Vozila u dolasku", short: "Dolazak", icon: "truck" },
  { href: "/o-nama", label: "O nama", short: "O nama", icon: "info" },
  { href: "/kontakt", label: "Kontakt", short: "Kontakt", icon: "phone" },
] as const;

/** Mobilna donja navigacija — pet odredišta, "O nama" je u podnožju i zaglavlju. */
export const MOBILE_NAV = ["/", "/vozila", "/premium", "/u-dolasku", "/kontakt"] as const;
