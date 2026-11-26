import { getRequestInfo } from "../utils/device/getRequestInfo.js"

export const checkHeaders = async (req,res) => {

    const check = getRequestInfo(req)

    console.log(`deviceType ${check.deviceType}`)
    console.log(`operatingSystem ${check.operatingSystem}`)
    console.log(`browser ${check.browser}`)
  
    

    res.status(201).json({
        message : 'Working',
        success  : true,
        data:check
    })
}


