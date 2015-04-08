// ==UserScript==
// @name stackexchange-quickcomment2
// @namespace http://keyboardfire.com/
// @grant none
// @license MIT
// @description Quick SE comments for quick SE people. (Vastly improved)
// @version 1.0.0
// @match *://*.stackexchange.com/*
// @match *://*.stackoverflow.com/*
// @match *://*.superuser.com/*
// @match *://*.serverfault.com/*
// @match *://*.askububtu.com/*
// @match *://*.stackapps.com/*
// @match *://*.mathoverflow.net/*
// ==/UserScript==

var userscript = function($) {

var qc2;
function updateLS() { localStorage.qc2 = JSON.stringify(qc2); }
if (localStorage.qc2) {
    qc2 = JSON.parse(localStorage.qc2);
} else {
    qc2 = {
        trigger: {
            altKey: true,
            ctrlKey: false,
            shiftKey: false,
            which: 88
        },
        data: {
            naa: 'This is not an answer.',
            welcome: 'Welcome to $SITENAME!',
            lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
        }
    };
    updateLS();
}

$(function() {
    $('<style>' +
        '.qc2_selected { background-color: #FF0; }' +
        '.qc2_popup { background-color: #E0EAF1; text-align: left; }' +
        '.qc2_popup > * { margin: 5px; word-wrap: break-word; }' +
    '</style>').appendTo('head');

    var dialog = $('<div>')
        .attr('id', 'qc2_dialog')
        .appendTo(document.body)
        .css({
            position: 'absolute',
            width: '250px',
            height: '350px',
            textAlign: 'left',
            overflowX: 'hidden',
            overflowY: 'scroll'
        })
        .addClass('qc2_popup')
        .append($('<button>')
            .text('settings')
            .mousedown(showSettings)
        )
        .append($('<input>')
            .attr('type', 'text')
            .keydown(function(e) {
                switch (e.which) {
                case 27: // esc
                    hideDialog();
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    var toChange = $('.qc2_selected').nextAll('div:visible').eq(0);
                    if (toChange.length) {
                        $('.qc2_selected').removeClass('qc2_selected');
                        toChange.addClass('qc2_selected');
                    }
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    var toChange = $('.qc2_selected').prevAll('div:visible').eq(0);
                    if (toChange.length) {
                        $('.qc2_selected').removeClass('qc2_selected');
                        toChange.addClass('qc2_selected');
                    }
                    break;
                }
            })
            .keyup(function(e) {
                if (e.which === 13) { // enter
                    var cmt = dialog.data('comment');
                    var str = $('span:last', '.qc2_selected').text()
                        .replace(/\$SITENAME/g, StackExchange.options.site.name)
                        .replace(/\$SITEURL/g, window.location.hostname);
                    cmt.val(cmt.val() + str);
                    hideDialog();
                } else if (e.which !== 40 && e.which !== 38) {
                    var txt = $('input', dialog).val(),
                        needToUpdateSelected = !$('>div:visible').length;
                    $('>div span:first-child', dialog).each(function() {
                        if (this.textContent.indexOf(txt) === -1) {
                            $(this).parent().hide();
                            if ($(this).parent().hasClass('qc2_selected')) {
                                needToUpdateSelected = true;
                            }
                        } else {
                            $(this).parent().show();
                        }
                    });
                    if (needToUpdateSelected) {
                        $('.qc2_selected').removeClass('qc2_selected');
                        $('>div:visible:first', dialog).addClass('qc2_selected');
                    }
                }
            })
            .blur(hideDialog)
        )
        .hide();

    // I don't know why I have to do this
    // but it works, so I'll just go with it
    dialog[0].scrollTop = 0;

    reloadDialogData();

    $(document).on('keydown', 'textarea[name="comment"]', function(e) {
        if (qc2.trigger.altKey === e.altKey &&
            qc2.trigger.ctrlKey === e.ctrlKey &&
            qc2.trigger.shiftKey === e.shiftKey &&
            qc2.trigger.which === e.which) {
            e.preventDefault();
            showDialog($(this));
        }
    });
});

function showDialog(commentBox) {
    $('#qc2_dialog').data('comment', commentBox).css({
        top: commentBox.offset().top,
        left: commentBox.offset().left
    }).show('fast');
    $('#qc2_dialog input').focus();
}

function hideDialog() {
    $('#qc2_dialog>div').show().removeClass('qc2_selected');
    $('#qc2_dialog>div:first').addClass('qc2_selected');
    $('#qc2_dialog input').val('');
    $('#qc2_dialog').hide().data('comment').focus();
}

function reloadDialogData() {
    $('#qc2_dialog>div').remove();
    for (var k in qc2.data) {
        var v = qc2.data[k];
        $('#qc2_dialog').append(kvpair(k, v));
    }
    $('#qc2_dialog>div:first').addClass('qc2_selected');
}

function showSettings() {
    var settingsDiv = $('<div>')
        .css({
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '400px',
            height: '400px',
            margin: '-200px 0px 0px -200px',
            overflowX: 'hidden',
            overflowY: 'scroll'
        })
        .addClass('qc2_popup')
        .appendTo(document.body)
        .append($('<button>')
            .text('Done')
            .click(function() {
                settingsDiv.remove();
            })
        )
        .append($('<br>'))
        .append($('<label>')
            .attr('for', 'qc2_trigger_input')
            .text('Trigger:')
        )
        .append($('<input>')
            .attr('id', 'qc2_trigger_input')
            .attr('type', 'text')
            .val(triggerStr())
            .keydown(function(e) {
                e.preventDefault();
                qc2.trigger = {
                    altKey: e.altKey,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    which: e.which
                };
                updateLS();
                $(this).val(triggerStr());
            })
        );

    for (var k in qc2.data) {
        var v = qc2.data[k];
        settingsDiv.append(kvpair(k, v)
            .append(linkbtn('edit', function(e) {
                    settingsDiv.remove();
                    var editKey = $(e.target).siblings(':first').text();
                    getStr('New value for ' + editKey + ':', function(str) {
                        qc2.data[editKey] = str;
                        updateLS();
                        reloadDialogData();
                        showSettings();
                    }, qc2.data[editKey]);
                })
            )
            .append(linkbtn('delete', function(e) {
                    settingsDiv.remove();
                    var editKey = $(e.target).siblings(':first').text();
                    getStr('Are you sure you want to remove ' + editKey +
                        '? (yes/no)', function(str) {
                        if (str === 'yes') {
                            delete qc2.data[editKey];
                            updateLS();
                            reloadDialogData();
                        }
                        showSettings();
                    });
                })
            )
        );
    }

    settingsDiv.append(linkbtn('new...', function() {
            settingsDiv.remove();
            getStr('New shortcut key:', function(newKey) {
                getStr('New value for ' + newKey + ':', function(newVal) {
                    qc2.data[newKey] = newVal;
                    updateLS();
                    reloadDialogData();
                    showSettings();
                });
            });
        })
    )
    .append(linkbtn('export...', function() {
            settingsDiv.remove();
            getStr('Copy the following text:', function() {}, JSON.stringify(qc2));
        })
    )
    .append(linkbtn('import...', function() {
            settingsDiv.remove();
            getStr('Paste exported text here:', function(str) {
                qc2 = JSON.parse(str);
                updateLS();
                reloadDialogData();
            });
        })
    );
}

function triggerStr() {
    return (
        (qc2.trigger.altKey ? 'Alt+' : '') +
        (qc2.trigger.ctrlKey ? 'Ctrl+' : '') +
        (qc2.trigger.shiftKey ? 'Shift+' : '') +
        String.fromCharCode(qc2.trigger.which)
    );
}

function getStr(query, callback, placeholder) {
    if (!placeholder) placeholder = '';
    var getDiv = $('<div>')
        .css({
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '400px',
            marginLeft: '-200px'
        })
        .addClass('qc2_popup')
        .appendTo(document.body)
        .append($('<div>')
            .text(query)
        )
        .append($('<input>')
            .val(placeholder)
            .attr('type', 'text')
            .keydown(function(e) {
                if (e.which === 13) {
                    $(this).parent().remove();
                    callback($(this).val());
                }
            })
        );
    getDiv.css({
        height: getDiv.height() + 'px',
        marginTop: '-' + (getDiv.height() / 2) + 'px'
    });
    $('input', getDiv).focus().select();
}

function linkbtn(text, callback) {
    return $('<a>')
        .attr('href', '#')
        .text(text)
        .css('padding-left', '5px')
        .click(function(e) {
            e.preventDefault();
            callback(e);
        });
}

function kvpair(k, v) {
    return $('<div>')
        .css({
            borderBottom: '1px dotted grey',
            padding: '2px 0px'
        })
        .append($('<span>')
            .text(k)
            .css({
                fontWeight: 'bold',
                paddingRight: '5px'
            })
        )
        .append($('<span>')
            .text(v)
            .css({
                color: 'grey'
            })
        );
}

};

var el = document.createElement('script');
el.type = 'text/javascript';
el.text = '(' + userscript + ')(jQuery);';
document.head.appendChild(el);
