export type USER_ROLE = "OWNER" | "MANAGER" | "CUSTOMER";
export type USER_LANGUAGE = "en" | "hi";
export type SHOP_TYPE = "STALL" | "RESTOURANT"; // Fixed spelling from RESTORENT
export type GENDER = "MALE" | "FEMALE" | "OTHER";
export type BLOOD_GROUP = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type DIETERY_TYPE = "VEG" | "NON_VEG" | "VEGAN";
export type MENU_CATEGORY_GROUP_TYPE = "DIETARY_BASED" | "SPICE_LEVEL_BASED" | "MEAL_BASED" | "COOKING_BASED" | "CUISINE_BASED" | "AUDIENCE_BASED" | "COURSE_BASED" | "BUSINESS_TAG_BASED";
export type SERVING_UNIT = "piece" | "slice" | "plate" | "gram" | "kilogram" | "other";
// export type ORDER_STATUS = "PENDING" | "DELIVERED" | "CANCELLED";
export type ORDER_ITEM_UNIT = "piece" | "slice" | "plate" | "gram" | "kilogram" | "other";
export type ORDER_STATUS =
  | "CREATED"
  | "ORDER_CONFIRMED"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "ORDER_CANCELLED"
  | "PAYMENT_FAILED";

export type User_Registration_Payload = {
    name: string;
    email: string;
    password: string;
}

type Shop_Registration_Payload = {
    shopName: string;
    shopType: SHOP_TYPE;
    location:Address
    hasSeating: boolean;
    totalFloors: number;
}
export type Shop_Owner_Registration_Payload = {
    userData: User_Registration_Payload;
    shopData: Shop_Registration_Payload;
}

export type Menu_category = {
    id: string;
    slug: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    imageFile: string | null;
    icon: string;
    color: string;
    groupType: MENU_CATEGORY_GROUP_TYPE;
    isFilterable: boolean;
    isMultiSelectable: boolean;
    createdAt: string;
    updatedAt: string;
}

export type Menu_Item = {
    id: string;
    name: string;
    description: string;
    categoryIds: string[];
    price: number;
    medias: Media_Item[];
    shopId: string;
    isActive: boolean;
    servingQuantity: number;
    servingUnit: SERVING_UNIT;
    // isAvailable: boolean;
    // isInOffer: boolean;
    // offerPrice: number;
    // offerStartDate: string;
    // offerEndDate: string;
    status: "ACTIVE";
    createdAt: string;
    updatedAt: string;
    variants?: {
        id: string;
        name: string; // half, full
        price: number;
        isAvailable: boolean;
        isInOffer?: boolean;
        offerPrice?: number;
        offerStartDate?: string;
        offerEndDate?: string;
    }[];
}


export type User_Meta_Data = {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    dieteryType: DIETERY_TYPE;
    interestedFoodCategories: string[];
}

export type Address = {
    id: string;
    city: string;
    pincode?: string;
    locality?: string;
    latitude: number;
    longitude: number;
    state: string;
    country: "India"
    referenceId : string
    referenceType  : "USER" | "SHOP";
    googleMapLocation?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    isDeleted: boolean;
    isVerified: boolean;
}

export type Compelete_User_Data = {
    name: string;
    email: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isDeleted: boolean;
    isVerified: boolean;
    password: string;
    profilePictureURL: string;
    role: USER_ROLE;
    language: USER_LANGUAGE;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
    coins: number;
    //seo purpose data 
    dob: string;
    gender: GENDER;
    bloodGroup: BLOOD_GROUP;
    /** Address */
    address: Address;
}



export type Media_Item = {
    id: string;
    menuItemId: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    createdAt: string;
    updatedAt: string;
}

export type Table = {
    id: string;
    shopId: string;
    floorId: string;
    tableNumber: number;
    totalSeats: number;
    isOccupied : boolean;
    createdAt: string;
    updatedAt: string;
    tableQR: string;
    currentOrderId?: string;
}

export type Compelete_Shop_Data = {
    shopName: string;
    shopType: SHOP_TYPE;
    hasSeating: boolean;
    totalFloors: number;
    logoURL: string | null;
    bannerImageURL: string | null;
    shopQR: string;
    /** Address */
    address: Address;
    //owner data
    ownerId: string; //from user table
    likesCount: number
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export type Order_Menu_Item = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unit: SERVING_UNIT;
    totalPrice: number;
    menuItemId: string;
}

export type Order_Create_Payload = {
    shopId: string;
    tableId?: string;
    userId: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: ORDER_STATUS;
    orderItems: Order_Menu_Item[];
    totalAmount: number;
}

export type Active_Orders = {
    id: string;
    shopId: string;
    tableId?: string;
    userId: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: ORDER_STATUS;
    orderItems: Order_Menu_Item[];
    createdAt: string;
    updatedAt: string;
    note: string

}

export type Order_Log = {
    id: string;
    shopId: string;
    tableId?: string;
    userId: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: ORDER_STATUS;
    orderItems: Order_Menu_Item[];
    createdAt: string;
    updatedAt: string;
    note: string
    paymentId?: string;
    razorpayOrderId?: string;
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
    paymentMethod?: "UPI" | "CARD" | "NETBANKING";
    paidAmount: number;
}

export type Reaction = {
    id: string;
    userId: string;
    targetId: string; // postId / recipeId
    targetType: "FEED" | "RECIPE";
    reactionType: "LIKE" | "DISLIKE";
    createdAt: string;
}

export type Feed_Post = {
    id: string;
    authorId: string;
    authorType: "OWNER" | "ADMIN";
    shopId?: string;
    title: string;
    description: string;
    medias: Media_Item[];
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    updatedAt: string;
}


//anyone can post recipe for their use
export type Recipe = {
    id: string;
    userId: string;
    title: string;
    description: string;
    ingredients: string[];
    steps: string[];
    medias: Media_Item[];
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    updatedAt: string;
}

export type Coin_Transaction = {
    id: string;
    userId: string;

    type: "CREDIT" | "DEBIT";

    amount: number;

    source:
      | "ORDER_REWARD"
      | "REDEEM"
      | "ADMIN_ADJUST";

    referenceId?: string; // orderId etc

    createdAt: string;
}