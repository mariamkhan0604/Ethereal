const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: String,
            image: String,
            unit_price: Number,
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            }
        }
    ]
});

module.exports = mongoose.model('Cart', CartSchema);