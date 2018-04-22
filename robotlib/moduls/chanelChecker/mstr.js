module.exports.chanelChecker = {
    modulename:'chanelChecker',
    name:'⚙️' + ' - ' + 'کانال تلگرام', 
    back:'🔙 برگشت به ⚙️ کانال تلگرام', 

    btns: {
        'settings' : 'تنظیمات'
    },

    query: {
        chanelChecker:'chanelChecker',
        admin:'a',
        settings:'st',
        activation:'act',
    },

    datas:{
        channel: {
            'name': 'معرفی ایدی کانال',
            'mess': 'لطفا ایدی کانال را بدون @ ارسال کنید.' + '\n' + 'سپس ابتدا ربات به عنوا ادمین در کانال مورد نظر عضو کنید، سپس پیام زیر را به داخل کانال ارسال کنید، پس از تشخیص کانال توسط ربات این پیام به صورت اتوماتیک حذف خواهد شد.' + '\n /registerbot',
        }
    }
}