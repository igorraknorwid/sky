/* eslint-disable prettier/prettier */
import {Suspense} from 'react';
import {
  Link,
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
  const filteringData: {types: any[]} = {
    types: [],
  };

  function getFilteringData() {
    const pageBy = 100;
    const {
      data: {collection},
    } = useShopQuery({
      query: FOR_FILTERING_COLLECTION_QUERY,
      variables: {handle, language, country, pageBy},
      preload: true,
    });

    const mapedByVendorCollection = [...collection.products.nodes].map(
      (node: any) => node.productType,
    );

    const removedVendorDublicaters = [...new Set(mapedByVendorCollection)];
    filteringData.types = [...removedVendorDublicaters];
  }

  const {
    language: {isoCode: language},
    country: {isoCode: country},
  } = useLocalization();

  getFilteringData();

  const filterAccumulator: {productTypes: string[]; vendors: string[]} = {
    productTypes: ["women's clothing", "men's clothing"],
    vendors: ['Zara'],
  };

  const prType = 'productType';
  const leftBreck = '{';
  const rightBreck = '}';
  const coska = '"';
  const dwetoczki = ':';
  const zapiata = ',';

  function setFiltersGrafQLString(fa: {
    productTypes: string[];
    vendors: string[];
  }) {
    let assembly = '';
    // const productType = 'productType';
    // const vendor = 'vendor';
    const leftBracket = '{';
    const rightBreck = '}';
    const anvil = '"';
    const colon = ':';
    const comma = ',';
    const setBlock = (Key: string, Value: string) => {
      return `${leftBracket}${Key}${colon}${anvil}${Value}${anvil}${rightBreck}${comma}`;
    };
    if (fa.productTypes) {
      fa.productTypes.forEach((node) => {
        const key = Object.keys(fa);
        const result = setBlock(key[0], node);
        assembly += result;
      });
    }
    if (fa.vendors) {
      fa.vendors.forEach((node) => {
        const key = Object.keys(fa);
        const result = setBlock(key[1], node);
        assembly += result;
      });
    }
    console.log('Assembly', assembly, typeof assembly);
    return assembly;
  }

  setFiltersGrafQLString(filterAccumulator);

  const type = search.substring(1).split('=')[1];

  const found = filteringData.types.find((element) => element === type);

  const checkedType = found && type;

  const assemble = `${leftBreck}${prType}${dwetoczki} ${coska}${type}${coska}${rightBreck}${zapiata}`;

  console.log('STRI', typeof assemble, assemble);

  const COLLECTION_WITH_PARAMS_QUERY = `
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
        products(
          first: $pageBy
          after: $cursor
          filters: [${assemble}]
        ) {
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

  const {
    data: {collection},
  } = useShopQuery({
    query: checkedType ? COLLECTION_WITH_PARAMS_QUERY : COLLECTION_QUERY,
    variables: type
      ? {type, handle, language, country, pageBy}
      : {handle, language, country, pageBy},
    preload: true,
  });

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
        <div className="flex">
          <div className="w-1/4">
            {filteringData?.types ? (
              <div>
                {filteringData.types.map((node) => (
                  <p
                    key={node}
                    className={`${
                      node === checkedType && 'font-bold'
                    }text-red-600`}
                  >
                    <Link to={`/collections/${handle}?type=${node}`}>
                      {node}
                    </Link>
                  </p>
                ))}
              </div>
            ) : (
              <p>No Filters</p>
            )}
          </div>
          <div>
            <ProductGrid
              key={collection.id}
              collection={collection}
              url={`/collections/${handle}?country=${country}`}
              type={type}
            />
          </div>
        </div>
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

// const COLLECTION_WITH_PARAMS_QUERY = gql`
//   ${PRODUCT_CARD_FRAGMENT}
//   query CollectionDetails(
//     $test: String
//     $handle: String!
//     $country: CountryCode
//     $language: LanguageCode
//     $pageBy: Int!
//     $cursor: String
//   ) @inContext(country: $country, language: $language) {
//     collection(handle: $handle) {
//       id
//       title
//       description
//       seo {
//         description
//         title
//       }
//       image {
//         id
//         url
//         width
//         height
//         altText
//       }
//       products(first: $pageBy, after: $cursor, filters: $test) {
//         nodes {
//           ...ProductCard
//         }
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//       }
//     }
//   }
// `;

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

const FOR_FILTERING_COLLECTION_QUERY = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionPage(
    $handle: String!
    $pageBy: Int!
    $cursor: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
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
