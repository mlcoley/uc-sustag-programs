MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    {"sTitle": "Program"},
    {"sTitle": "Description"},
    {"sTitle": "Tags"},
    {"sTitle": "Campus"},
    {"sTitle": "Activities"},
    {"sTitle": "Topic Areas (icon)"},
    {"sTitle": "Contacts"},
    {"sTitle": "Topic Areas"},
];

hiddenColumns = [
    "Tags",
    "Topic Areas"
];

filterColumns = [
    "Campus",
    "Activities",
    "Topic Areas"
];

iconColumns = [
    "Topic Areas"
];

for (var k in iconColumns) {
    iconColumns[k] = toFieldname(iconColumns[k]);
}

MyApp.hide = hiddenColumns.map(getIndex);

MyApp.filterIndexes = {};
for (var k in filterColumns){
    var key = toFieldname(filterColumns[k]);
    MyApp.filterIndexes[key] = getIndex(filterColumns[k]);
    MyApp[key] = [];
}
/* ------------------------------------------------------------------------- */
String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? "&hellip;" : "");
};
/* -------------------------------------------------------------------------
RegExp.escape()
source: Mathias Bynens on stackoverflow.com
http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
---------------------------------------------------------------------------- */
RegExp.escape = function(str) {
    return str.replace(/[-[\]{}()*+?.,\\/^$|#]/g, "\\$&");
};
/* ------------------------------------------------------------------------- */
/* instructions for making a spreadsheet accessible
http://billing.chillidoghosting.com/knowledgebase/48/Publishing-Spreadsheets-to-Google-Docs.html
*/
/* ------------------------------------------------------------------------- */
$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/1Yrq7iNjFIUGv9N1DLATs_WlP-i9VUQYqb23lnUaQMJA/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {

            var tags = parseList(val.gsx$tags.$t, ";", "Tags");
            var campus = parseList(val.gsx$campus.$t, ";", "Campus");
            var activities = parseList(val.gsx$activities.$t, ";", "Activities");
            var topics = parseList(val.gsx$topicareas.$t, ";", "Topic Areas");

            var iconstr = "";
            for (var k = 0; k < topics.list.length; k++) {
                iconstr += generateIcon(topics.list[k]);
            }
            MyApp.spreadsheetData.push([
                    val.gsx$programs.$t,
                    GenerateDescription(val),
                    tags.str,
                    campus.str,
                    activities.str,
                    iconstr,
                    GenerateContact(val),
                    topics.str
                  ]);
        });

        for (var k in MyApp.filterIndexes) {
            MyApp[k].sort();
        }

        createDataTable();
        generateFilterBox();
        addFilters();
        configurePopups();
    });
})
/* ------------------------------------------------------------------------- */
function getIndex(x) {
    var out = null;
    for (var k in MyApp.headerData) {
        if (MyApp.headerData[k].sTitle.toLowerCase() == x.toLowerCase()) {
            out = k;
            break;
        }
    }
    return Number(out);
}
/* ------------------------------------------------------------------------- */
function toFieldname(str) {
    str = str.replace(/\s/g, "_").replace(/\W/g, "")
    return str.toLowerCase();
}
/* ------------------------------------------------------------------------- */
function parseList(str, sep, field) {
    field = toFieldname(field);
    var out = "";
    var items = [];
    $.each(str.trim().replace(/^[\r\n]+|\.|[\r\n]+$/g, "").split(sep), function (key, val) {
        val = val.trim(); //need to trim the semi-colon separated values after split
        if (MyApp.hasOwnProperty(field)) {
            if ($.inArray(val, MyApp[field]) === -1 && val.length !== 0) {
                MyApp[field].push(val);
            }
        }
        if (val) {
            out += val + "<br />";
            items.push(val);
        }
    });
    return {str: out.replace(/(=?\<br \/\>)*$/g, "").trim(),
            list: items
    }; //remove tailing line break(s)
}
/* -------------------------------------------------------------------------
NOTE: this following two sections are borrowed from Hainesy via stackoverflow
http://stackoverflow.com/questions/10238089/how-can-you-ensure-twitter-bootstrap-popover-windows-are-visible
   ------------------------------------------------------------------------- */
function configurePopups(){
    $('[data-toggle="popover"]').each(function() {
        var trigger = $(this);
        var tmp = trigger.attr("data-original-title");
        console.log(tmp);
        trigger.popover({
            animation: true,
            delay: { show: 0, hide: 0 },
            html: true,
            trigger: 'hover',
            placement: getPlacementFunction(trigger.attr("data-placement"), 200, 300)
        });
    });
}
/* -------------------------------------------------------------------------
NOTE: this still need work, esp. when the hovered element is exactly in the
middle of the screen (i think)
   ------------------------------------------------------------------------- */
var getPlacementFunction = function (defaultPosition, width, height) {
    return function (tip, element) {
        var position, top, bottom, left, right;

        var $element = $(element);
        var boundTop = $(document).scrollTop(); /*NOTE: hardcode */
        var boundLeft = $(document).scrollLeft();
        var boundRight = boundLeft + $(window).width();
        var boundBottom = boundTop + $(window).height();

        // console.log([boundTop, boundLeft, boundRight, boundBottom]);

        var pos = $.extend({}, $element.offset(), {
            width: element.offsetWidth,
            height: element.offsetHeight
        });

        var isWithinBounds = function (elPos) {
            return boundTop < elPos.top && boundLeft < elPos.left && boundRight > (elPos.left + width) && boundBottom > (elPos.top + height);
        };

        var testTop = function () {
            if (top === false) return false;
            top = isWithinBounds({
                top: pos.top - height,
                left: pos.left + pos.width / 2 - width / 2
            });
            return top ? "top" : false;
        };

        var testBottom = function () {
            if (bottom === false) return false;
            bottom = isWithinBounds({
                top: pos.top + pos.height,
                left: pos.left + pos.width / 2 - width / 2
            });
            return bottom ? "bottom" : false;
        };

        var testLeft = function () {
            if (left === false) return false;
            left = isWithinBounds({
                top: pos.top + pos.height / 2 - height / 2,
                left: pos.left - width
            });
            return left ? "left" : false;
        };

        var testRight = function () {
            if (right === false) return false;
            right = isWithinBounds({
                top: pos.top + pos.height / 2 - height / 2,
                left: pos.left + pos.width
            });
            return right ? "right" : false;
        };

        switch (defaultPosition) {
            case "top":
                if (position = testTop()) return position;
            case "bottom":
                if (position = testBottom()) return position;
            case "left":
                if (position = testLeft()) return position;
            case "right":
                if (position = testRight()) return position;
            default:
                if (position = testTop()) return position;
                if (position = testBottom()) return position;
                if (position = testLeft()) return position;
                if (position = testRight()) return position;
                return defaultPosition;
        }
    }
};
/* ------------------------------------------------------------------------- */
function GenerateDescription(val /* entry value from spreadsheet */){
    var desc_short = "<span style='font-size: 0.8em;'>" + val.gsx$description.$t.trunc(80) + "</span>";
    var tmp = val.gsx$programs.$t;

    /*replace single-quotes with html code, replace newline with <br>*/
    var desc = val.gsx$description.$t.replace(/'/g, "&#39;").replace(/\n+/g, "<br>");

    var desc_full = "<a href='#' class='project-popover' data-toggle='popover' data-content='" +
        desc + "' data-html='true' data-original-title='" +
        tmp + "'>" +
        desc_short +
        "</a>";

    return desc_full;
}
/* ------------------------------------------------------------------------- */
function generateIcon(str) {
    return "<i class='ucicon-" + toFieldname(str) + "'></i>"
}
/* ------------------------------------------------------------------------- */
function generateFilterBox() {
    var template = '<div class="accordion-group">' +
    '   <div class="accordion-heading">' +
    '     <a class="accordion-toggle" data-toggle="collapse" href="#collapse$FIELD$">' +
    '       $NAME$ <i class="icon-chevron-down pull-right"></i>' +
    '     </a>' +
    '   </div>' +
    '   <div id="collapse$FIELD$" class="accordion-body collapse">' +
    '       <div class="accordion-inner">' +
    '           <ul id="$FIELD$" class="unstyled filterlist"></ul>' +
    '       </div>' +
    '   </div>' +
    '</div>';
    for (var k in filterColumns) {
        var field = filterColumns[k];
        var str = template.replace(/\$FIELD\$/g, toFieldname(field));
        str = str.replace(/\$NAME\$/g, field);
        document.getElementById("filterAccordion").innerHTML += str;
    }
}
/* ------------------------------------------------------------------------- */
function GenerateContact(val) {
    var contacts = val.gsx$contacts.$t.trim().split(";");
    var str = "#name#<br /><span class='discreet'>#title#</span>";
    var info = "";
    var re = /([^\[]*)/g;
    var re2 = /\[([^\]]*)\]/g;
    for (var k in contacts){
        if (contacts[k]) {
            var name = re.exec(contacts[k]);
            if (name) {
                info += name[1];
            }

            var title = re2.exec(contacts[k]);
            if (title) {
                info += "<br /><span class='discreet'>" + title[1] + "</span>";
            }
            info += "<br />";
        }
    }
    info += "<a target='_blank' href='" + val.gsx$website.$t + "'><i class='icon-globe'></i> </a>";
    info += "<a href='mailto:" + val.gsx$email.$t + "'><i class='icon-envelope'></i></a>";
    return info;
}
/* ------------------------------------------------------------------------- */
function addFilters(){

    for (var k in MyApp.filterIndexes) {
        var $value = $("#" + k);
        $.each(MyApp[k], function (key, val) {
            var tmp = val;
            if ($.inArray(k, iconColumns) > -1) {
                tmp = generateIcon(val) + " " + val;
            }
            $value.append('<li><label><input type="checkbox" name="' + val + '"> ' + tmp + '</label></li>');
        });
    }

    $(".filterrow").on("click", "ul.filterlist", function (e) {
        var filterRegex = "";
        var filterName = this.id;
        var filterIndex = MyApp.filterIndexes[filterName];
        var filters = [];
        $("input", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += RegExp.escape(val.name); //Use the hat and dollar to require an exact match
            }
        });

        MyApp.oTable.fnFilter(filterRegex, filterIndex, true, false);
        // hideUnavailableOrganizations();
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", "ul.filterlist").each(function () {
            this.checked = false;
        });

        $("ul.filterlist").click();
    });
}
/* ------------------------------------------------------------------------- */
function displayCurrentFilters() {
    var $filterAlert = $("#filters");

    var filters = "";

    $("input:checked", "#filterAccordian").each(function () {
        if (filters.length !== 0) {
            filters += " + "
        }
        filters += "<strong>" + this.name + "</strong>";
    });

    if (filters.length !== 0) {
        var alert = $("<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " + filters + "</p></div>")

        $filterAlert.html(alert);
        $filterAlert[0].scrollIntoView(true);
    } else {
        $filterAlert.html(null);
    }
}
/* ------------------------------------------------------------------------- */
function createDataTable() {
    //Create a sorter that uses case-insensitive html content
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "link-content-pre": function (a) {
            return $(a).html().trim().toLowerCase();
        },

        "link-content-asc": function (a, b) {
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        },

        "link-content-desc": function (a, b) {
            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        }
    });

    MyApp.oTable = $("#spreadsheet").dataTable({
        "aoColumnDefs": [
            //{ "sType": "link-content", "aTargets": [ 0 ] },
            { "bVisible": false, "aTargets": MyApp.hide } //hide the tags column
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });

    // ensure that popups are configured each time a page is drawn
    $("#spreadsheet").on( 'draw.dt', function () {
        /*NOTE:
            This may have odd behavior (i.e. triggerd by events other than)
            'page'; however, on('page.dt'...) is called *before* the page is
            rendered, thus in that case we configure popups for the page that
            we are leaving. So for now this appears to work
        */
        configurePopups();
    } );
}
/* ------------------------------------------------------------------------- */
