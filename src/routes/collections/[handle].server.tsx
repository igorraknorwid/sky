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
import {IconSearch} from './../../components/elements/Icon';

const pageBy = 48;
let assemble = '';

function checkSearchParam(strings: string[], types: string[]) {
  let result = true;
  strings.forEach((search) => {
    const find = types.find((v) => v === search);
    if (!find) {
      result = false;
    }
  });
  return result;
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

function setSearchString(
  node: string,
  sa: {
    productType: string[];
    productVendor: string[];
  },
) {
  let str = '?';
  function checkNodeInSearchArray(node: string, searchArr: string[]) {
    const find = searchArr.find((o) => o === node);
    return Boolean(find);
  }
  if (checkNodeInSearchArray(node, sa.productType)) {
    str = '';
  } else {
    str += `type=${node}`;
  }
  // if (checkNodeInSearchArray(node, sa.productVendor)) {
  //   str = '';
  // } else {
  //   str = `?brand=${node}`;
  // }
  return str;
}

function findNodeInSearchParams(node: string, arr: string[]) {
  const find = arr.find((o) => o === node);
  return Boolean(find);
}

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

  const searchParams: string[] = search.substring(1).split('&');

  if (searchParams.length === 0) {
    IsRightSearchParams = false;
  }

  const {
    language: {isoCode: language},
    country: {isoCode: country},
  } = useLocalization();

  getFilteringData(); // fetch full collection data

  if (searchParams.length) {
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

    const checkProductTypes = checkSearchParam(
      stringAccunulator.productType,
      filteringData.types,
    );

    const checkVendors = checkSearchParam(
      stringAccunulator.productVendor,
      filteringData.vendors,
    );

    if (!checkProductTypes) {
      IsRightSearchParams = false;
    }

    if (!checkVendors) {
      IsRightSearchParams = false;
    }

    // set GrafQL query
    assemble = setFiltersGrafQLString(stringAccunulator);
  }

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
      ? COLLECTION_WITH_PARAMS_QUERY
      : COLLECTION_QUERY,
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
              <Link to={`/collections/${handle}`}>Reset all filters</Link>
            </div>
            <div>
              <p className="font-bold text-2xl">Filter by:</p>
              <div>
                {filteringData?.types ? (
                  <div>
                    {filteringData.types.map((node) => (
                      <p
                        key={node}
                        className={`${
                          findNodeInSearchParams(
                            node,
                            stringAccunulator.productType,
                          ) && 'text-green-500'
                        }`}
                      >
                        {/* <Link to={`/collections/${handle}?type=${node}`}> */}
                        <Link
                          to={`/collections/${handle}${setSearchString(
                            node,
                            stringAccunulator,
                          )}`}
                        >
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
              <p className="font-bold text-2xl">Brands:</p>
              <div>
                {filteringData?.vendors ? (
                  <div>
                    {filteringData.vendors.map((node) => (
                      <p
                        key={node}
                        className={`${
                          findNodeInSearchParams(
                            node,
                            stringAccunulator.productVendor,
                          ) && 'text-green-500'
                        }`}
                      >
                        <Link
                          to={`/collections/${handle}${setSearchString(
                            node,
                            stringAccunulator,
                          )}`}
                        >
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
