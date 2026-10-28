import mongoose from 'mongoose'

const navbarSchema = new mongoose.Schema({
    logo:{
        type : String,
        required :[true , 'Logo is Required']
    },
    navItems:[
        {
        label :{
              type : String,
              required :true
            },
    path: {
        type: String,
        required: true
      },
    }]

})

const NavbarModel = mongoose.model('NavbarModel',navbarSchema)

export default NavbarModel

