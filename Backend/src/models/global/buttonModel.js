import mongoose from 'mongoose'

const buttonSchema = new mongoose.Schema({
    label : {
        type : String,
        required : [ true , 'Label is required for button']
    },
    variant :{
        type :String,
        default : 'primary'
    },
    path:{
        type : String,
        default : ''
    },
    isActive :{
        type :Boolean,
        default : true
    }
},
{timestamps:true}
);

const Buttons = mongoose.model('Buttons',buttonSchema)

export default Buttons