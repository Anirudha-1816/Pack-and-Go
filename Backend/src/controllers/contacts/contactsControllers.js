
import statusCode from  '../../utils/statusCodes.js'
import Contact from '../../models/contacts/contactsModel.js'

import { transporter } from '../../utils/emails/sendEmail.js'


import {
  thankYouEmail,
  adminNotificationEmail,
} from '../../utils/emails/emailTemplate.js'

export const createContacts = async (req,res,next) => {

try {
        const {email , message , fullName , phoneNumber} = req.body

        if(!email && !message && !fullName && !phoneNumber){

            const error = new Error('Please fill all the field')
            error.status = statusCode.BAD_REQUEST
            error.extraDetail = 'Some field maybe missing fill all of them '

            return next(error)
        }
        

        const contact = await Contact.create({
            fullName,
            email,
            phoneNumber,
            message 
        })

        const userEmailHtml = thankYouEmail({
      name: fullName,
      message,
    });
    const adminEmailHtml = adminNotificationEmail({
      name: fullName,
      email,
      phone: phoneNumber,
      message,
    });

        await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank You for Contacting Pack&Go",
        html: userEmailHtml,
      }),

      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Submission from ${fullName}`,
        html: adminEmailHtml,
        replyTo: email,
      }),
    ]);    

    res.status(statusCode.OK).json({
        success : true,
        message : 'Thanks! for contacting We,ll get back to you soon!'
    })
    
} catch (err) {
    next(err)
}
    
}

