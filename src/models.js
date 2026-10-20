import { makeCrud } from './lib/crud.js';
import {
  categorySchema,
  menuItemSchema,
  packageSchema,
  testimonialSchema,
} from './schemas.js';

export const categories = makeCrud({ table: 'menu_categories', schema: categorySchema });
export const menuItems = makeCrud({ table: 'menu_items', schema: menuItemSchema, json: ['dietary'] });
export const packages = makeCrud({ table: 'packages', schema: packageSchema, json: ['includes'] });
export const testimonials = makeCrud({ table: 'testimonials', schema: testimonialSchema });
