import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

const locales = ['en', 'es'];

export default getRequestConfig(async ({requestLocale}) => {
  const resolvedLocale = await requestLocale;
  const locale = resolvedLocale || 'es';

  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
