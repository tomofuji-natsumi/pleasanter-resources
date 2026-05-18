/* コード元作成者：植盛さん */
$p.events.on_editor_load_arr = [];

$p.events.on_editor_load_arr.push(function() {
    let myData = JSON.parse($('#MyComments').val());

    if (!myData) return;
    
    let myKeys = Object.keys(myData);
    myKeys.forEach(function (myKey) {
        let $comment = $('[id="Comment' + myKey + '.wrapper"]');
        if ($comment.length && myData[myKey]) {
            $comment.css({
                'color': myData[myKey].color,
                'background-color': myData[myKey].backgroundColor,
                'border-left': '8px solid ' + myData[myKey].borderColor
            });
        }
    });
})

$p.events.on_editor_load = function() {
    for (let i = 0; i < $p.events.on_editor_load_arr.length; i++) {
        $p.events.on_editor_load_arr[i] ();
    }
}
