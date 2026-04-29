import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "./globals.css";

export const metadata = {
  title: "Efraín: Explorador de la Palabra",
  description: "Una aventura interactiva para que los niños descubran los tesoros de la Biblia Hebrea mediante Inteligencia Artificial y cuentos personalizados.",
  keywords: ["biblia infantil", "hebreo", "cuentos interactivos", "educación cristiana", "Ollama", "IA local"],
  authors: [{ name: "Efraín App Team" }],
  openGraph: {
    title: "Efraín: Explorador de la Palabra",
    description: "Descubre los secretos del hebreo bíblico con cuentos generados por IA.",
    url: "https://efrain-app.vercel.app",
    siteName: "Efraín App",
    locale: "es_ES",
    type: "website",
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'es'].includes(locale)) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full bg-pastoral-pattern text-stone-900 selection:bg-sky-100 selection:text-sky-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
