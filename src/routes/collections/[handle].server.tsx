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
  let IsRightSearchParams = true;
  const filteringData: {types: any[]; vendors: any[]} = {
    types: [],
    vendors: [],
  };

  const stringAccunulator: {productType: string[]; productVendor: string[]} = {
    productType: [],
    productVendor: [],
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

    const mapedByProductTypeCollection = [...collection.products.nodes].map(
      (node: any) => node.productType,
    );
    filteringData.types = [...new Set(mapedByProductTypeCollection)];

    const mapedByVendorCollection = [...collection.products.nodes].map(
      (node: any) => node.vendor,
    );
    filteringData.vendors = [...new Set(mapedByVendorCollection)];
  }

  function setFiltersGrafQLString(fa: {
    productType: string[];
    productVendor: string[];
  }) {
    let assembly = '';
    const leftBracket = '{';
    const rightBreck = '}';
    const anvil = '"';
    const colon = ':';
    const comma = ',';
    const setBlock = (Key: string, Value: string) => {
      return `${leftBracket}${Key}${colon}${anvil}${Value}${anvil}${rightBreck}${comma}`;
    };
    const setAssembly = (node: string, arrKey: number) => {
      const key = Object.keys(fa);
      const result = setBlock(key[arrKey], node);
      assembly += result;
    };

    if (fa.productType) {
      fa.productType.forEach((node) => {
        setAssembly(node, 0);
      });
    }
    if (fa.productVendor) {
      fa.productVendor.forEach((node) => {
        setAssembly(node, 1);
      });
    }
    return assembly;
  }

  const searchParams: string[] = search.substring(1).split('&');
  if (searchParams.length) {
    IsRightSearchParams = false;
  }

  const {
    language: {isoCode: language},
    country: {isoCode: country},
  } = useLocalization();

  getFilteringData();

  // fill Filter Accumulator

  searchParams?.forEach((node) => {
    const splitedNode = node.split('=');
    if (splitedNode[0] === 'type') {
      stringAccunulator.productType.push(splitedNode[1]);
    }
    if (splitedNode[0] === 'brand') {
      stringAccunulator.productVendor.push(splitedNode[1]);
    }
    if (splitedNode[0] !== 'brand' && splitedNode[0] !== 'type') {
      IsRightSearchParams = false;
    }
  });

  setFiltersGrafQLString(stringAccunulator); // set GrafQL query
  const assemble = setFiltersGrafQLString(stringAccunulator);

  // const checkSearchParam = (strings: string[], types: string[]) => {
  //   let result = true;
  //   strings.forEach((vendor) => {
  //     const find = types.find((v) => v === vendor);
  //     if (!find) {
  //       result = false;
  //     }
  //   });
  //   return result;
  // };

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
    query: IsRightSearchParams
      ? COLLECTION_QUERY
      : COLLECTION_WITH_PARAMS_QUERY,
    variables: {handle, language, country, pageBy},
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
            <div>
              <p>Filter by:</p>
              <div>
                {filteringData?.types ? (
                  <div>
                    {filteringData.types.map((node) => (
                      <p key={node} className={`text-red-600`}>
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
            </div>
            <div>
              <p>Brands:</p>
              <div>
                {filteringData?.vendors ? (
                  <div>
                    {filteringData.vendors.map((node) => (
                      <p key={node} className={`text-red-600`}>
                        <Link to={`/collections/${handle}?brand=${node}`}>
                          {node}
                        </Link>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>No Filters</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <ProductGrid
              key={collection.id}
              collection={collection}
              url={`/collections/${handle}?country=${country}`}
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
