export default async function checkAuth(req, res, next){
    const { id } = req.cookies;
    console.log(req.cookies)
    console.log(req.db)
    let db = req.db
    let usersData = db.collection("users")
    const user = await usersData.findOne({id})
    console.log('checking',user, id)
    if(!user || !id) {
        return res.status(401).json({msg: "Not logged in please Login in!"})
    }
    next()
}