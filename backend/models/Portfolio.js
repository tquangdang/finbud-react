import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({ 
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Arrays display user's portfolio overtime
    portfolio: [{
        date: { type: Date, required: true },
        totalValue: { type: Number, required: true }
    }]
})

//Index to ensure each user has only one portfolio
portfolioSchema.index({ userId: 1 }, { unique: true }); 

export default mongoose.model('Portfolio', portfolioSchema);