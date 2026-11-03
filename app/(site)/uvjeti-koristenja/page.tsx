import type { Metadata } from "next";
import Link from "next/link";
import { LegalArticle } from "@/components/site/LegalArticle";
import { PageHeader } from "@/components/site/PageHeader";
import { fullAddress } from "@/lib/contact";
import { LEGAL } from "@/lib/legal";
import { getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Uvjeti korištenja",
  description: "Uvjeti korištenja web stranice Auto Centra DEA: informativni karakter oglasa, cijene, odgovornost i autorska prava.",
  alternates: { canonical: "/uvjeti-koristenja" },
};

/**
 * Uvjeti korištenja — štite investitora (salon) i izvođača od najčešćih
 * sporova: greška u cijeni ili opisu vozila, „obećana“ dostupnost, kopiranje
 * fotografija, zloupotreba obrasca. Ne isključuju prava potrošača koja se
 * po zakonu ne mogu isključiti.
 */
export default async function TermsPage() {
  const s = await getSiteSettings();
  const owner = LEGAL.companyName || s.business_name;
  const address = fullAddress(s);

  return (
    <>
      <PageHeader title="Uvjeti korištenja" crumbs={[{ name: "Početna", href: "/" }, { name: "Uvjeti korištenja" }]} />
      <LegalArticle>
        <section>
          <h2>1. O stranici</h2>
          <p>
            Ovu web stranicu vodi <strong>{owner}</strong>
            {address ? `, ${address}` : ""}
            {LEGAL.idNumber ? `, ID broj ${LEGAL.idNumber}` : ""} (u daljnjem tekstu: salon). Korištenjem stranice
            prihvaćate ove uvjete. Ako se s njima ne slažete, molimo vas da stranicu ne koristite.
          </p>
        </section>

        <section>
          <h2>2. Prikaz vozila nije ponuda</h2>
          <p>
            Vozila, cijene i opisi na stranici služe isključivo za informiranje. Oni ne predstavljaju ponudu u smislu Zakona
            o obligacionim odnosima, nego poziv da se salonu učini ponuda. Kupoprodajni ugovor zaključuje se isključivo u
            pisanom obliku, u salonu, nakon pregleda vozila.
          </p>
          <p>
            Slanje upita preko stranice nije narudžba ni rezervacija i ne obavezuje ni vas ni salon. Vozilo je rezervirano
            tek kad to salon izričito potvrdi, pod uvjetima dogovorenim u tom trenutku.
          </p>
        </section>

        <section>
          <h2>3. Točnost podataka i cijena</h2>
          <p>
            Podatke o vozilima (godište, kilometraža, oprema, snaga, povijest i drugo) unosimo savjesno, prema dostupnoj
            dokumentaciji i pregledu vozila. Unatoč tome, moguće su greške u unosu ili promjene stanja nakon objave.
            Mjerodavni su podaci utvrđeni pri pregledu vozila u salonu i oni navedeni u kupoprodajnom ugovoru — preporučujemo
            da prije kupovine provjerite sve što vam je važno.
          </p>
          <p>
            Cijene su informativne i mogu se promijeniti bez najave. Očigledna greška u cijeni (npr. pogrešno upisana
            znamenka) ne obavezuje salon. Konačna cijena i uvjeti plaćanja utvrđuju se ugovorom.
          </p>
          <p>
            Za vozila „u dolasku“ navedeni datumi su okvirni i ne predstavljaju obavezu salona. Status vozila (dostupno,
            rezervirano, prodano) ažuriramo redovno, ali ne možemo jamčiti da je u svakom trenutku točan.
          </p>
          <p>
            Fotografije prikazuju stvarno vozilo iz ponude, osim ako je drukčije navedeno. Boje i detalji na zaslonu mogu
            odstupati od stvarnih.
          </p>
        </section>

        <section>
          <h2>4. Ograničenje odgovornosti</h2>
          <p>
            Salon nastoji da stranica bude dostupna i ispravna, ali ne jamči neprekidan rad bez grešaka. U mjeri u kojoj to
            zakon dopušta, salon ne odgovara za štetu nastalu zbog privremene nedostupnosti stranice, tehničkih grešaka ili
            oslanjanja na informacije sa stranice bez provjere u salonu.
          </p>
          <p>
            Ovo ograničenje ne odnosi se na štetu prouzrokovanu namjerno ili krajnjom nepažnjom, niti umanjuje prava koja
            potrošačima pripadaju prema propisima o zaštiti potrošača i obligacionim odnosima, a koja se ugovorom ne mogu
            isključiti.
          </p>
        </section>

        <section>
          <h2>5. Autorska prava</h2>
          <p>
            Fotografije, tekstovi, logo i izgled stranice vlasništvo su salona ili se koriste uz dopuštenje nosilaca prava.
            Zabranjeno ih je kopirati, preuzimati ili objavljivati na drugim stranicama i oglasnicima bez prethodne pisane
            suglasnosti salona. Dijeljenje poveznice na stranicu vozila je dopušteno i dobrodošlo.
          </p>
        </section>

        <section>
          <h2>6. Dopušteno korištenje</h2>
          <p>Nije dopušteno:</p>
          <ul>
            <li>slati lažne, uvredljive ili neželjene (reklamne) poruke preko obrasca za upit;</li>
            <li>predstavljati se kao druga osoba ili koristiti tuđu email adresu;</li>
            <li>automatski prikupljati sadržaj stranice (npr. programima za „struganje“ podataka);</li>
            <li>pokušavati neovlašteno pristupiti administraciji ili ometati rad stranice.</li>
          </ul>
          <p>Salon može blokirati pristup ili odbiti upite koji krše ova pravila.</p>
        </section>

        <section>
          <h2>7. Google karta i vanjske poveznice</h2>
          <p>
            Lokacija salona prikazuje se pomoću usluge Google Karte, koju pruža Google. Za tu uslugu vrijede{" "}
            <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">
              Dodatni uvjeti korištenja Google Karata
            </a>{" "}
            i{" "}
            <a href="https://policies.google.com/privacy?hl=hr" target="_blank" rel="noopener noreferrer">
              Googleova pravila privatnosti
            </a>
            . Za podatke koje Google prikuplja pri prikazu karte Google je samostalni kontrolor podataka; kako ih obrađujemo
            mi i kako kartu možete isključiti opisano je u <Link href="/privatnost#kolacici">Politici privatnosti</Link>.
          </p>
          <p>
            Prikaz karte, plan puta i procjena vremena putovanja dolaze od Googlea i služe samo kao pomoć. Mjerodavna je
            adresa salona navedena na stranici. Salon ne odgovara za netočnost ili privremenu nedostupnost karte ni za
            upute koje daje Google.
          </p>
          <p>
            Stranica sadrži i poveznice na druge vanjske usluge (društvene mreže, WhatsApp, Viber). Za njihov sadržaj i
            obradu podataka odgovorni su njihovi pružatelji, prema vlastitim pravilima.
          </p>
        </section>

        <section>
          <h2>8. Privatnost</h2>
          <p>
            Kako obrađujemo lične podatke i koje kolačiće koristimo opisano je u{" "}
            <Link href="/privatnost">Politici privatnosti i kolačića</Link>.
          </p>
        </section>

        <section>
          <h2>9. Izmjene i mjerodavno pravo</h2>
          <p>
            Salon može izmijeniti ove uvjete; izmjene vrijede od objave na ovoj stranici. Na ove uvjete primjenjuje se pravo
            Bosne i Hercegovine. Za sporove je nadležan {LEGAL.court}, osim ako propisi o zaštiti potrošača određuju
            drukčiju nadležnost.
          </p>
        </section>
      </LegalArticle>
    </>
  );
}
