const display_attic_dialog = require('../menu/attic_dialog');

$('#armrAboutBtn').click(function() {
    const html_content = 
`<div style="text-align: center; padding-left: 20px; padding-right: 20px; color: rgb(200, 200, 200)">
<div style="font-size: 20px"><b>Hey!</b></div>
Thanks for checking out my project modRadar!

modRadar is a weather radar app designed to help people track storms, monitor severe weather, 
and stay informed about changing conditions in real time. Whether you're watching approaching rain, 
snow, or severe storms, modRadar helps you stay prepared and aware.

modRadar is free to use and doesn't have any ads. 
I hope that you enjoy the app! 

Copyright © 2025. All rights reserved.
</div>
</div>`

    display_attic_dialog({
        'title': 'About',
        'body': html_content,
        'color': 'rgb(120, 120, 120)',
        'textColor': 'black',
    })
})
