/**
 * Photography per product, in gallery order: primary, alternate, detail.
 * Files live in /public/img and are served locally, so the storefront makes
 * no third-party image requests. Photography: Unsplash.
 */
export const PRODUCT_IMAGES: Record<string, string[]> = {
  'onyx-pleated-kurta': [
    '/img/jacket-woman.jpg',
    '/img/fabric-dark.jpg',
    '/img/rack-white.jpg',
  ],
  'ivory-chikankari-kurta': [
    '/img/tee-white-woman.jpg',
    '/img/rack-white.jpg',
    '/img/fabric-poncho.jpg',
  ],
  'charcoal-wide-leg-trousers': [
    '/img/trousers-wide.jpg',
    '/img/trousers-model.jpg',
    '/img/rack-neutral.jpg',
  ],
  'ecru-khaddar-shirt': ['/img/jacket-olive.jpg', '/img/rack-neutral.jpg', '/img/shirts-hangers.jpg'],
  'organza-dupatta': [
    '/img/fabric-poncho.jpg',
    '/img/rack-white.jpg',
    '/img/fabric-dark.jpg',
  ],
  'ivory-pleated-kurta': [
    '/img/coat-arcade.jpg',
    '/img/tee-white-woman.jpg',
    '/img/rack-white.jpg',
  ],
  'ivory-washed-kurta': [
    '/img/tee-white-man.jpg',
    '/img/shirts-hangers.jpg',
    '/img/rack-neutral.jpg',
  ],
  'black-cotton-kurta': ['/img/tee-black-man.jpg', '/img/fabric-dark.jpg', '/img/rack-hangers.jpg'],
  'charcoal-straight-trousers': [
    '/img/trousers-model.jpg',
    '/img/rack-neutral.jpg',
    '/img/trousers-wide.jpg',
  ],
  'black-oversized-shirt': [
    '/img/coat-man.jpg',
    '/img/tee-black-man.jpg',
    '/img/fabric-dark.jpg',
  ],
  'ivory-shawl-collar-coat': [
    '/img/coat-blue.jpg',
    '/img/coat-man.jpg',
    '/img/fabric-poncho.jpg',
  ],
  'black-wool-overshirt': [
    '/img/jacket-olive.jpg',
    '/img/bomber-hanger.jpg',
    '/img/rack-neutral.jpg',
  ],
  'black-leather-tote': [
    '/img/bag-handbag.jpg',
    '/img/bag-backpack.jpg',
    '/img/flatlay-accessories.jpg',
  ],
  'ivory-silk-scarf': [
    '/img/fabric-poncho.jpg',
    '/img/fabric-dark.jpg',
    '/img/shirts-hangers.jpg',
  ],
  'monochrome-pashmina': [
    '/img/rack-white.jpg',
    '/img/fabric-poncho.jpg',
    '/img/flatlay-accessories.jpg',
  ],
  'white-heavyweight-tee': [
    '/img/tee-white-man.jpg',
    '/img/tee-white-woman.jpg',
    '/img/rack-white.jpg',
  ],
  'black-heavyweight-tee': [
    '/img/tee-black-man.jpg',
    '/img/editorial-teal.jpg',
    '/img/fabric-dark.jpg',
  ],
};

/** Editorial photography used outside the product grid. */
export const EDITORIAL = {
  hero: '/img/coat-arcade.jpg',
  editorial: '/img/fabric-dark.jpg',
  studio: '/img/store-interior.jpg',
  materials: '/img/rack-hangers.jpg',
  authSignIn: '/img/jacket-woman.jpg',
  authSignUp: '/img/coat-arcade.jpg',
  wishlist: '/img/flatlay-accessories.jpg',
  categories: {
    women: '/img/editorial-teal.jpg',
    men: '/img/coat-man.jpg',
    accessories: '/img/bag-handbag.jpg',
    essentials: '/img/tee-white-man.jpg',
  } as Record<string, string>,
};
