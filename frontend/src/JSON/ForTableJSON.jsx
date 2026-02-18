import  JSONData  from './TableItems.json';

let dashData = JSONData;

const asArray = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.__collections__)) {
        return data.__collections__;
    }

    return [];
};


export const ForTableJSON = {



    getProductsData() {

        return asArray(dashData);
    },

    getProductsMini() {
        return Promise.resolve(this.getProductsData().slice(0, 5));
    },

    getProductsSmall() {
        return Promise.resolve(this.getProductsData().slice(0, 10));
    },

    getProducts() {
        return Promise.resolve(this.getProductsData());
    },

    getProductsWithOrdersSmall() {
        return Promise.resolve(this.getProductsWithOrdersData().slice(0, 10));
    },

    getProductsWithOrders() {
        return Promise.resolve(this.getProductsWithOrdersData());
    }
};
