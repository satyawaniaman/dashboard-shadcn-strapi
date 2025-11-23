import type { Schema, Struct } from '@strapi/strapi';

export interface SharedSalesItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_sales_items';
  info: {
    displayName: 'salesItem';
    icon: 'bulletList';
  };
  attributes: {
    price: Schema.Attribute.Decimal;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Integer;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.sales-item': SharedSalesItem;
    }
  }
}
