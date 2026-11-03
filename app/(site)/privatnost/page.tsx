import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/site/consent/CookieSettingsButton";
import { LegalArticle, LegalTable } from "@/components/site/LegalArticle";
import { PageHeader } from "@/components/site/PageHeader";
import { fullAddress } from "@/lib/contact";
import { AUTHORITY, LEGAL, RETENTION } from "@/lib/legal";
import { emailNotificationsEnabled } from "@/lib/notify";
import { getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Politika privatnosti i kolačića",
  description: "Kako Auto Centar DEA obrađuje lične podatke iz upita, koje kolačiće koristi web stranica i kako ostvariti svoja prava.",
  alternates: { canonical: "/privatnost" },
};

/**
 * Politika privatnosti prema Zakonu o zaštiti ličnih podataka BiH
 * („Sl. glasnik BiH“ 12/25), posebno čl. 15. (informacije pri prikupljanju).
 *
 * Tekst opisuje STVARNO ponašanje aplikacije: odjeljci o Resendu i
 * Turnstileu prikazuju se samo kad su te usluge uključene (varijable
 * okruženja). Pravni podaci i rokovi dolaze iz lib/legal.ts.
 */
export default async function PrivacyPage() {
  const s = await getSiteSettings();
  const controller = LEGAL.companyName || s.business_name;
  const address = fullAddress(s);
  const contactEmail = LEGAL.privacyEmail || s.email;
  const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
  const resend = emailNotificationsEnabled();
  const mail = contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : null;

  return (
    <>
      <PageHeader
        title="Politika privatnosti i kolačića"
        description="Kratko i jasno: prikupljamo samo ono što je potrebno da odgovorimo na vaš upit. Bez analitike, bez oglasa."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Privatnost" }]}
      />
      <LegalArticle>
        <section>
          <h2>1. Tko obrađuje vaše podatke</h2>
          <p>
            Kontrolor podataka (voditelj obrade) je <strong>{controller}</strong>
            {address ? `, ${address}` : ""}
            {LEGAL.idNumber ? `, ID broj ${LEGAL.idNumber}` : ""}
            {LEGAL.registry ? `, upisan kod: ${LEGAL.registry}` : ""}.
          </p>
          <p>
            Za sva pitanja o zaštiti ličnih podataka i za ostvarivanje svojih prava obratite nam se
            {mail ? <> na {mail}</> : null}
            {s.phone ? <>{mail ? " ili" : ""} telefonom na {s.phone}</> : null}
            {address ? <>, odnosno pismom na adresu salona</> : null}.
          </p>
          <p>
            Ovu politiku donosimo u skladu sa Zakonom o zaštiti ličnih podataka („Službeni glasnik BiH“, broj 12/25; u
            daljnjem tekstu: Zakon).
          </p>
        </section>

        <section>
          <h2 id="upiti">2. Koje podatke obrađujemo, zašto i koliko dugo</h2>
          <LegalTable
            head={["Podaci", "Svrha", "Pravni osnov", "Rok čuvanja"]}
            rows={[
              [
                "Email adresa, poruka (ako je napišete), vozilo na koje se upit odnosi, vrijeme slanja",
                "Odgovor na vaš upit o vozilu ili usluzi",
                "Radnje na vaš zahtjev prije eventualnog zaključenja ugovora (čl. 8. st. 1. t. b) Zakona); za opće upite naš legitimni interes da odgovorimo (t. f)",
                `${RETENTION.inquiryMonths} mjeseca od slanja, zatim automatsko brisanje`,
              ],
              [
                "Jednosmjerni sažetak (HMAC) vaše IP adrese — sama IP adresa se ne sprema",
                "Sprečavanje zloupotrebe obrasca (ograničenje broja upita s iste adrese)",
                "Legitimni interes zaštite stranice od neželjenih poruka (čl. 8. st. 1. t. f)",
                `${RETENTION.ipHashDays} dana, zatim automatsko brisanje`,
              ],
              ...(turnstile
                ? [[
                    "Tehnički podaci preglednika i IP adresa koje obrađuje Cloudflare Turnstile",
                    "Provjera da obrazac šalje čovjek, a ne automatizirani program",
                    "Legitimni interes zaštite od zloupotrebe (čl. 8. st. 1. t. f)",
                    "Prema pravilima Cloudflarea; mi te podatke ne spremamo",
                  ]]
                : []),
              [
                "Tehnički zapisi o pristupu (IP adresa, vrijeme, tražena stranica, vrsta preglednika)",
                "Siguran i ispravan rad stranice, otkrivanje napada",
                "Legitimni interes (čl. 8. st. 1. t. f)",
                "Kratkotrajno, prema pravilima pružatelja hostinga",
              ],
              [
                "IP adresa i tehnički podaci preglednika koje prima Google pri učitavanju karte",
                "Prikaz lokacije salona na karti",
                "Legitimni interes (čl. 8. st. 1. t. f); kartu možete isključiti (čl. 23)",
                "Mi te podatke ne primamo; Google prema vlastitim pravilima",
              ],
              [
                "Vaš izbor o kolačićima (kolačić „dea_privola“)",
                "Pamćenje vašeg izbora o Google karti",
                "Legitimni interes — poštivanje vašeg izbora (čl. 8. st. 1. t. f)",
                `${RETENTION.consentDays} dana`,
              ],
            ]}
          />
          <p className="mt-4">
            Email adresa potrebna je da bismo vam mogli odgovoriti. Ako je ne želite ostaviti, slobodno nas nazovite ili
            posjetite salon — slanje upita nije uvjet ni za što. Poruke nemojte koristiti za slanje posebno osjetljivih
            podataka (npr. o zdravlju) ni ličnih dokumenata.
          </p>
          <p>
            Ako nakon upita kupite vozilo, podaci potrebni za kupoprodajni ugovor, registraciju i knjigovodstvo čuvaju se
            izvan web stranice, u rokovima koje propisuju zakoni o računovodstvu i porezima. Podatke iz upita možemo čuvati
            i dulje od navedenog roka samo ako su nužni za postavljanje ili odbranu pravnog zahtjeva.
          </p>
          <p>
            Vaše podatke <strong>ne prodajemo</strong>, ne koristimo za reklamne poruke, ne izrađujemo profile i ne
            donosimo automatizirane odluke koje bi na vas imale pravni učinak.
          </p>
        </section>

        <section>
          <h2>3. Tko još ima pristup podacima</h2>
          <p>
            Upite vide samo ovlašteni djelatnici salona, nakon prijave u zaštićenu administraciju. Za rad stranice koristimo
            pružatelje usluga koji podatke obrađuju isključivo po našim uputama, kao obrađivači (čl. 30. Zakona):
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — baza podataka i prijava djelatnika; podaci se nalaze u podatkovnom centru u
              Frankfurtu (Njemačka, EU).
            </li>
            <li>
              <strong>Vercel</strong> — hosting stranice; poslužitelj aplikacije je u Parizu (Francuska, EU), a statični
              sadržaj može se isporučivati s najbližeg čvora mreže.
            </li>
            {resend && (
              <li>
                <strong>Resend</strong> — slanje obavijesti o novom upitu na email adrese djelatnika salona. Obavijest sadrži
                vašu email adresu i poruku.
              </li>
            )}
            {turnstile && (
              <li>
                <strong>Cloudflare</strong> — usluga Turnstile za zaštitu obrasca od automatiziranih programa.
              </li>
            )}
            <li>
              <strong>Izvođač koji tehnički održava stranicu</strong> — pristupa sistemu samo kad je to potrebno za
              održavanje ili otklanjanje greške, na osnovu pisanog ugovora o obradi i obaveze povjerljivosti.
            </li>
          </ul>
          <p>
            Podatke otkrivamo državnim organima samo kad smo na to obavezni zakonom, na osnovu valjanog zahtjeva.
          </p>
          <h3>Prenos podataka izvan Bosne i Hercegovine</h3>
          <p>
            Navedeni pružatelji obrađuju podatke u državama Europske unije ili su društva sa sjedištem u SAD-u. Prenos se
            obavlja samo u države i prema primaocima za koje je Europska unija utvrdila odgovarajuću razinu zaštite (za SAD:
            primaoci uključeni u okvir EU–SAD o privatnosti podataka), što se prema čl. 47. st. 2. Zakona smatra
            adekvatnom zaštitom.
          </p>
        </section>

        <section>
          <h2 id="kolacici">4. Kolačići i vanjski sadržaji</h2>
          <p>
            Kolačići su male datoteke koje stranica sprema u vaš preglednik. Javni dio stranice koristi{" "}
            <strong>samo nužne kolačiće</strong>; ne koristimo analitiku (npr. Google Analytics), oglasne mreže, piksele
            društvenih mreža ni slične alate za praćenje.
          </p>
          <LegalTable
            head={["Kolačić", "Tko ga postavlja", "Svrha", "Trajanje", "Pravni osnov"]}
            rows={[
              ["dea_privola", "Ova stranica", "Pamti vaš izbor o kolačićima i Google karti", `${RETENTION.consentDays} dana`, "Nužan za rad stranice"],
              [
                "sb-…-auth-token",
                "Ova stranica (Supabase)",
                "Prijava djelatnika u administraciju; posjetiteljima se ne postavlja",
                "Do odjave ili isteka prijave",
                "Nužan za rad stranice",
              ],
              [
                "Googleovi kolačići (npr. NID)",
                "Google",
                "Postavljaju se kad se učita karta s lokacijom salona; Google ih koristi prema vlastitim pravilima",
                "Određuje Google",
                "Legitimni interes (čl. 8. st. 1. t. f); kartu možete isključiti",
              ],
            ]}
          />
          <p className="mt-4">
            Da biste lakše pronašli salon, na stranici prikazujemo kartu s Google Karata. Kad se karta učita, Google dobiva
            vašu IP adresu i tehničke podatke preglednika te može postaviti svoje kolačiće. Pravni osnov je naš legitimni
            interes da posjetiteljima pokažemo lokaciju salona (čl. 8. st. 1. t. f) Zakona). Obradu smo ograničili: karta
            se učitava tek kad dođe u vidno polje, ne koristimo je za praćenje ni oglašavanje, a{" "}
            <strong>možete je isključiti u svakom trenutku</strong> — gumbom „Isključi kartu“ u obavijesti ili preko
            „Postavke kolačića“ u podnožju (pravo na prigovor, čl. 23. Zakona). Nakon isključenja karta se više ne učitava
            dok je sami ne uključite. Za podatke koje prikuplja Google on je samostalni kontrolor; više u{" "}
            <a href="https://policies.google.com/privacy?hl=hr" target="_blank" rel="noopener noreferrer">
              Googleovim pravilima privatnosti
            </a>
            . Umjesto karte uvijek možete koristiti poveznicu „Otvori u Google Kartama“.
          </p>
          <p>
            Prije uvođenja karte procijenili smo je li legitimni interes opravdan: karta je posjetiteljima stranice salona
            uobičajen i očekivan način da pronađu adresu; učitava se samo na dijelu stranice s kontaktom i lokacijom; mi iz
            nje ne primamo nikakve podatke o vama; a vi je možete isključiti jednim klikom ili umjesto nje koristiti
            običnu poveznicu. Zaključili smo da ta obrada ne prevladava nad vašim pravima i interesima. Ako se s tim ne
            slažete, isključite kartu ili nam se obratite.
          </p>
          <p>
            Svoj izbor možete promijeniti u svakom trenutku:{" "}
            <CookieSettingsButton className="font-semibold underline underline-offset-2" />. Kolačiće koje je već postavio
            Google možete obrisati u postavkama preglednika.
          </p>
        </section>

        <section>
          <h2>5. Vaša prava</h2>
          <p>U skladu sa Zakonom imate pravo:</p>
          <ul>
            <li>na pristup — da saznate obrađujemo li vaše podatke i dobijete njihovu kopiju (čl. 17);</li>
            <li>na ispravku netočnih podataka (čl. 18);</li>
            <li>na brisanje podataka (čl. 19);</li>
            <li>na ograničenje obrade (čl. 20);</li>
            <li>na prenosivost podataka koje ste nam dali (čl. 22);</li>
            <li>
              na prigovor na obradu koja se zasniva na legitimnom interesu (čl. 23) — u tom slučaju obradu prekidamo, osim
              ako dokažemo uvjerljive legitimne razloge;
            </li>
            <li>da u svakom trenutku isključite Google kartu („Postavke kolačića“ u podnožju).</li>
          </ul>
          <p>
            Zahtjev možete poslati {mail ? <>na {mail}</> : "na kontakt iz točke 1"}. Odgovorit ćemo bez nepotrebnog
            odgađanja, a najkasnije u roku od 30 dana; u složenim slučajevima rok se može produžiti, o čemu ćemo vas
            obavijestiti (čl. 14. st. 3). Ostvarivanje prava je besplatno. Ako budemo u opravdanoj sumnji tko podnosi
            zahtjev, možemo zatražiti dodatnu potvrdu identiteta — najčešće je dovoljno da nam pišete s adrese s koje ste
            poslali upit.
          </p>
          <p>
            Ako smatrate da obrada nije u skladu sa Zakonom, imate pravo podnijeti prigovor nadzornom organu —{" "}
            <a href={AUTHORITY.url} target="_blank" rel="noopener noreferrer">
              {AUTHORITY.name}
            </a>{" "}
            — ili tužbu nadležnom sudu.
          </p>
        </section>

        <section>
          <h2>6. Kako štitimo podatke</h2>
          <ul>
            <li>sva komunikacija sa stranicom je šifrirana (HTTPS);</li>
            <li>pristup upitima imaju samo djelatnici s vlastitim korisničkim računom, uz provjeru ovlasti na serveru i u bazi;</li>
            <li>IP adresu ne spremamo, nego samo njen nepovratni sažetak, koji se briše nakon {RETENTION.ipHashDays} dana;</li>
            <li>stari upiti brišu se automatski, bez ručnog postupanja;</li>
            <li>prikupljamo najmanje moguće podatke — ne tražimo ime, adresu ni broj telefona.</li>
          </ul>
          <p>
            U slučaju povrede ličnih podataka koja može ugroziti vaša prava, o tome ćemo obavijestiti Agenciju u roku
            propisanom Zakonom, a vas bez odgađanja ako postoji visok rizik (čl. 35. i 36).
          </p>
        </section>

        <section>
          <h2>7. Djeca</h2>
          <p>
            Stranica i upiti namijenjeni su punoljetnim osobama. Ako saznamo da nam je upit poslala osoba mlađa od 16
            godina, podatke ćemo obrisati; roditelj ili staratelj to može zatražiti u svakom trenutku.
          </p>
        </section>

        <section>
          <h2>8. Izmjene ove politike</h2>
          <p>
            Politiku ažuriramo kad se promijeni način obrade (npr. nova usluga). Važeća verzija uvijek je objavljena na ovoj
            stranici, s datumom od kojeg vrijedi. Ako uvedemo novu vrstu kolačića koja traži privolu, ponovo ćemo vas pitati.
          </p>
        </section>
      </LegalArticle>
    </>
  );
}
