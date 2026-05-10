/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/biometric-lock`; params?: Router.UnknownInputParams }
        | { pathname: `/notifications`; params?: Router.UnknownInputParams }
        | { pathname: `/survey`; params?: Router.UnknownInputParams }
        | { pathname: `/../../web/.next/types/app/layout`; params?: Router.UnknownInputParams }
        | {
            pathname: `/../../web/.next/types/app/[locale]/layout`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/../../web/.next/types/app/[locale]/page`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(auth)'}/otp` | `/otp`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(auth)'}/phone` | `/phone`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/assistant` | `/assistant`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/catalog` | `/catalog`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/quotes` | `/quotes`; params?: Router.UnknownInputParams };
      hrefOutputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | { pathname: `/biometric-lock`; params?: Router.UnknownOutputParams }
        | { pathname: `/notifications`; params?: Router.UnknownOutputParams }
        | { pathname: `/survey`; params?: Router.UnknownOutputParams }
        | { pathname: `/../../web/.next/types/app/layout`; params?: Router.UnknownOutputParams }
        | {
            pathname: `/../../web/.next/types/app/[locale]/layout`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/../../web/.next/types/app/[locale]/page`;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(auth)'}/otp` | `/otp`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(auth)'}/phone` | `/phone`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/assistant` | `/assistant`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/catalog` | `/catalog`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/quotes` | `/quotes`; params?: Router.UnknownOutputParams };
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | `/biometric-lock${`?${string}` | `#${string}` | ''}`
        | `/notifications${`?${string}` | `#${string}` | ''}`
        | `/survey${`?${string}` | `#${string}` | ''}`
        | `/../../web/.next/types/app/layout${`?${string}` | `#${string}` | ''}`
        | `/../../web/.next/types/app/[locale]/layout${`?${string}` | `#${string}` | ''}`
        | `/../../web/.next/types/app/[locale]/page${`?${string}` | `#${string}` | ''}`
        | `/_sitemap${`?${string}` | `#${string}` | ''}`
        | `${'/(auth)'}/otp${`?${string}` | `#${string}` | ''}`
        | `/otp${`?${string}` | `#${string}` | ''}`
        | `${'/(auth)'}/phone${`?${string}` | `#${string}` | ''}`
        | `/phone${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/assistant${`?${string}` | `#${string}` | ''}`
        | `/assistant${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/catalog${`?${string}` | `#${string}` | ''}`
        | `/catalog${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}`
        | `/${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/profile${`?${string}` | `#${string}` | ''}`
        | `/profile${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/quotes${`?${string}` | `#${string}` | ''}`
        | `/quotes${`?${string}` | `#${string}` | ''}`
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/biometric-lock`; params?: Router.UnknownInputParams }
        | { pathname: `/notifications`; params?: Router.UnknownInputParams }
        | { pathname: `/survey`; params?: Router.UnknownInputParams }
        | { pathname: `/../../web/.next/types/app/layout`; params?: Router.UnknownInputParams }
        | {
            pathname: `/../../web/.next/types/app/[locale]/layout`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/../../web/.next/types/app/[locale]/page`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(auth)'}/otp` | `/otp`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(auth)'}/phone` | `/phone`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/assistant` | `/assistant`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/catalog` | `/catalog`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/quotes` | `/quotes`; params?: Router.UnknownInputParams };
    }
  }
}
