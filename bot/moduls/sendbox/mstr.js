module.exports.sendbox = {
    modulename:'sendbox',
    //admin
    name:'📨 ارسال پیام', 
    back:'🔙 بازگشت به ارسال پیام',
    sendboxSymbol:'ـ ' + '🗒 ',

    btns: {
        newmess:'پیام جدید',
        deleteall:'حذف همه از لیست',
    },

    mess: {
        gettitle:'لطفا عنوان پیام را ارسال کنید.',
        gettext:'متن جدید را ارسال کنید.',
        wrongtitle : 'این عنوان قبلا ثبت شده است، لطفا عنوان دیگری انتخواب کنید.',
        contactWadminMess:'لطفا پیام متنی خود را برای مدیر مجموعه ارسال کنید.',
    },

    query: {
        sendbox:'messageToUsers',
        send :'post',
        delete :'delete',
        title :'editTitle',
        text :'edit',
    }
}