import mongoose from 'mongoose'

const contentBlockSchema  = new mongoose.Schema({
    heading : {
        type : String,
        required : [ true , 'Heading is required for content block']
    },

    subheading:{
           type : String,
        default : ''
        
    },
    description : {
        type : String,
        required : [ true , 'Description is required for content block']
    },

     
    subDescription:{
        type : String,
        default : ''
    },
    componentIdentifier:{
        type :String,
        required : true,
        unique: true
    },

    images:[
        {
            type :String,
            require : [ true , 'Atleast one image is required for content block']

        }
    ],


    isActive :{
        type :Boolean,
        default : true
    }
},
{timestamps:true}
);

const ContentBlocks = mongoose.model('ContentBlocks',contentBlockSchema)

export default ContentBlocks