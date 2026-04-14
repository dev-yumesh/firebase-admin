export const USER_ROLES = {
    CUSTOMER:"CUSTOMER",
    OWNER:"OWNER",
    MANAGER:"MANAGER"
}

export const SHOP_TYPES = {
    STALL:"STALL",
    RESTAURANT:"RESTAURANT"
}

export const APP_LANGUAGE = {
    EN:'en',
    HI:'hi'
}

export const MENU_CATEGORY_GROUP_TYPE = {
    DIETARY_BASED: "DIETARY_BASED",
    SPICE_LEVEL_BASED: "SPICE_LEVEL_BASED",
    MEAL_BASED: "MEAL_BASED",
    COOKING_BASED: "COOKING_BASED",
    CUISINE_BASED: "CUISINE_BASED",
    AUDIENCE_BASED: "AUDIENCE_BASED",
    COURSE_BASED: "COURSE_BASED",     // Starter, Main Course
    BUSINESS_TAG_BASED: "BUSINESS_TAG_BASED" // Best Seller, New
  };

  /**
 * Configuration for each category group.
 * Determines whether multiple categories can be selected
 * from the same group while creating a menu item.
 *
 * Example:
 * - DIETARY_BASED: Only one allowed (Veg OR Non-Veg)
 * - MEAL_BASED: Multiple allowed (Lunch AND Dinner)
 */
export const MENU_CATEGORY_GROUP_CONFIG = {
    /**
     * A dish can belong to only one dietary type.
     * Example: Veg OR Non-Veg OR Vegan OR Jain
     */
    DIETARY_BASED: {
      label: "Dietary Based",
      isMultiSelectable: false,
    },
  
    /**
     * A dish typically has a single spice level.
     * Example: Mild OR Medium OR Spicy
     */
    SPICE_LEVEL_BASED: {
      label: "Spice Level Based",
      isMultiSelectable: false,
    },
  
    /**
     * A dish can be served in multiple meals.
     * Example: Lunch AND Dinner
     */
    MEAL_BASED: {
      label: "Meal Based",
      isMultiSelectable: true,
    },
  
    /**
     * A dish may involve multiple cooking techniques.
     * Example: Grilled AND Tandoor
     */
    COOKING_BASED: {
      label: "Cooking Based",
      isMultiSelectable: true,
    },
  
    /**
     * A dish may belong to multiple cuisines.
     * Example: Indian AND Punjabi OR Indo-Chinese
     */
    CUISINE_BASED: {
      label: "Cuisine Based",
      isMultiSelectable: true,
    },
  
    /**
     * A dish can target multiple audience groups.
     * Example: Kids Special AND Family Pack
     */
    AUDIENCE_BASED: {
      label: "Audience Based",
      isMultiSelectable: true,
    },
  
    /**
     * A dish belongs to only one course.
     * Example: Starter OR Main Course OR Dessert
     */
    COURSE_BASED: {
      label: "Course Based",
      isMultiSelectable: false,
    },
  
    /**
     * Business and promotional tags.
     * Example: Best Seller, New, Chef Special, Trending
     */
    BUSINESS_TAG_BASED: {
      label: "Business Tag Based",
      isMultiSelectable: true,
    },
  } as const;