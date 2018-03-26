module.exports.post = {
    modulename:'post',
    //admin
    name:'🔖 مطالب',
    back:'⤴️ برگشت به 🔖 مطالب',

    endupload:'اتمام آپلود',
    endAttach:'اتمام پیوست',

    edit:{
        newSCMess :'لطفا یک نام برای مطلب جدید انتخاب کنید.' + '\n' + 'توجه کنید که این نام در داخل منو ها نمایش داده میشود.',            
        name:'لطفا نام جدید مطلب را وارد کنید.',
        description:'توضیحات جدید را وارد کنید.',
        category:'لطفا دسته بندی مورد نظر را انتخاب کنید.',
        upload:'متناسب با نوع مطلب، فایلی که میخاهید آپلود شود را ارسال کنید.',
        attach:'اکنون هر نوع فایلی را که میخواهید به عنوان پیوست بعد از مطلب مورد نظر ارسال شود، برایم ارسال کنید.',
        order:'لطفا اولویت مطلب را با عدد مشخص کنید. ترتیب محصولات و دسته بندی ها هنگامی که لیست میشوند بر اساس این اعداد است.',
        price:'لطفا قیمت محصول را مشخص کنید، قیمت را باید به صورت عدد صحیح وارد کنید و مقدار آن باید بیشتر از 100 باشد.',
    },

    uploadMess: {
        'file'  : 'ابتدا یک فایل پیوست کنید.',
        'photo' : 'ابتدا یک تصویر پیوست کنید.',
        'audio' : 'ابتدا یک فایل صوتی پیوست کنید.',
        'video' : 'ابتدا یک فایل ویدیو پیوست کنید.',
    },

    idNames: {
        'file'  : 'fileid',
        'photo' : 'photoid',
        'audio' : 'audioid',
        'video' : 'videoid',
    },

    postOptions: ['❌ حذف مطلب', '✏️ افزودن مطلب'],
    scErrors : [
        'نام دسته بندی ها  مطالب نباید مثل هم باشد.',
        'مطب دیگری با این نام قبلا ثبت شده است.',
        'دسته بندی دیگری با این نام قبلا ثبت شده است.'        
    ],

    //post types
    types:{
        text : {'icon':'📄', 'name':'text'},
        file : {'icon':'📎', 'name':'file'},
        video: {'icon':'📺', 'name':'video'},
        sound: {'icon':'🎧', 'name':'sound'},
        photo: {'icon':'🏞', 'name':'photo'},
        attached:' - 🃏(دارای فایل)',
        ticket:'ticket'
    },

    query: {
        post:'post',
        admin:'a',
        name:'name',
        category:'cat',
        description:'des',
        caption:'cap',
        attachment:'att',
        removeAttachment:'ratt',
        isproduct:'isproduct',
        price:'prc',
        publication:'publish',

        text       :'format' + 'text',
        file       :'format' + 'file',
        photo      :'format' + 'photo',
        sound      :'format' + 'sound',
        video      :'format' + 'video',
    }
}