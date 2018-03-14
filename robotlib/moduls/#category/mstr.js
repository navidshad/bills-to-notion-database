module.exports.category = {
    modulename:'category',
    asoption : 'دسته بندی',
    //admin
    name:'🗂 '+'دسته بندی',
    back:'⤴️ برگش به دسته بندی مطالب',
    message:'لطفا دسته بندی که میخواهید این قابلیت در آن نمایش داده ود را انتخاب کنید.',
    maincategory: 'دسته اصلی',  //don't change it, it has been stored in categories collection
    categoryoptions: ['📝 ویرایش دسته های فعلی', '✏️ افزودن دسته'],
    
    backtoParent:'⤴️ برگشت به بالا',
    edit:{
        name:'لطفا نام جدید دسته بندی را ارسال کنید.',
        parent:'لطفا دسته بندی مادر را انتخاب کنید.',
        description:'لطفا توضیحات دسته بندی را انتخاب کنید.',
        order:'لطفا اولویت دسته بندی را با عدد مشخص کنید. ترتیب محصولات و دسته بندی ها هنگامی که لیست میشوند بر اساس این اعداد است.'
    },

    //query
    queryCategory        :'category',
    queryCategoryName       :'name',
    queryCategoryParent     :'parent',
    queryCategoryDescription:'description',
    queryOrder              :'order',
    queryDelete             :'del'
}