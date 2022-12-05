/* eslint-disable prettier/prettier */
import {Suspense} from 'react';
import {
  gql,
  type HydrogenRouteProps,
  Seo,
  ShopifyAnalyticsConstants,
  useServerAnalytics,
  useLocalization,
  useShopQuery,
  type HydrogenRequest,
  type HydrogenApiRouteOptions,
} from '@shopify/hydrogen';

import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {PageHeader, ProductGrid, Section, Text} from '~/components';
import {NotFound, Layout} from '~/components/index.server';

const pageBy = 48;

export default function Collection({params, search}: HydrogenRouteProps) {
  const {handle} = params;
  const type = search.substring(1).split('=')[1];
  console.log('search', type);

  const {
    language: {isoCode: language},
    country: {isoCode: country},
  } = useLocalization();

  const {
    data: {collection},
  } = useShopQuery({
    query: type ? COLLECTION_WITH_PARAMS_QUERY : COLLECTION_QUERY,
    variables: type
      ? {type, handle, language, country, pageBy}
      : {handle, language, country, pageBy},
    preload: true,
  });
  // const filter = {
  //   ...collection,
  //   products: {
  //     ...collection.products,
  //     nodes: collection?.products?.nodes.slice(0, 2),
  //   },
  // };
  // console.log('FILTER', filter);
  // const filtered =
  // console.log('COLLECTION', collection?.products?.nodes.slice(0, 3));
  if (!collection) {
    return <NotFound type="collection" />;
  }

  useServerAnalytics({
    shopify: {
      canonicalPath: `/collections/${handle}`,
      pageType: ShopifyAnalyticsConstants.pageType.collection,
      resourceId: collection.id,
      collectionHandle: handle,
    },
  });

  return (
    <Layout>
      <Suspense>
        <Seo type="collection" data={collection} />
      </Suspense>
      <PageHeader heading={collection.title}>
        {collection?.description && (
          <div className="flex items-baseline justify-between w-full">
            <div>
              <Text format width="narrow" as="p" className="inline-block">
                {collection.description}
              </Text>
            </div>
          </div>
        )}
      </PageHeader>
      <Section>
        <ProductGrid
          key={collection.id}
          collection={collection}
          url={`/collections/${handle}?country=${country}`}
          type={type}
        />
      </Section>
    </Layout>
  );
}

// API endpoint that returns paginated products for this collection
// @see templates/demo-store/src/components/product/ProductGrid.client.tsx
export async function api(
  request: HydrogenRequest,
  {params, queryShop}: HydrogenApiRouteOptions,
) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {Allow: 'POST'},
    });
  }

  // const type = "women's clothing";
  const url = new URL(request.url);
  // console.log(' URL:::!!!', url);
  const type = url.searchParams.get('type');
  console.log(' TYPE:::!!!', type);
  const cursor = url.searchParams.get('cursor');
  const country = url.searchParams.get('country');
  const {handle} = params;

  return await queryShop({
    query: PAGINATE_COLLECTION_QUERY,
    variables: {
      type,
      handle,
      cursor,
      pageBy,
      country,
    },
  });
}

export interface IType {
  productType: string;
}

const COLLECTION_WITH_PARAMS_QUERY = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionDetails(
    $type: String!
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int!
    $cursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(first: $pageBy, after: $cursor, filters: {productType: $type}) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const COLLECTION_QUERY = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int!
    $cursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(first: $pageBy, after: $cursor) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const PAGINATE_COLLECTION_QUERY = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionPage(
    $type: String
    $handle: String!
    $pageBy: Int!
    $cursor: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $pageBy, after: $cursor, filters: {productType: $type}) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
