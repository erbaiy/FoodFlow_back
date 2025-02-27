// src/modules/menu-item/constants/menu-item.constants.ts
export const MENU_ITEM_CATEGORIES = ['appetizer', 'main', 'dessert', 'beverage'] as const;
export type MenuItemCategory = typeof MENU_ITEM_CATEGORIES[number];