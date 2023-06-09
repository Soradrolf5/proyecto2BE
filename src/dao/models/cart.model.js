import mongoose from "mongoose";
const cartCollection = 'carts'

const cartSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    products: {
        type: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'products'
                },
                quantity: {
                    type: Number,
                    default: 0
                }
            }
        ],
        default: []
    }
}, { strictPopulate: false })

const cartModel = mongoose.model(cartCollection, cartSchema);

export default cartModel;
