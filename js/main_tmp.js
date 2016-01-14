MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Program" },
    { "sTitle": "Description" },
    { "sTitle": "Website" },
    { "sTitle": "Contacts" },
    {"sTitle": "Tags"},
    {"sTitle": "Campus"},
    {"sTitle": "Activities"}
];
//filterIndexes is a map between names and the index in headerData (spreadsheetData too)
MyApp.filterIndexes = { "tag": 4, "campus": 5, "activities": 6};
MyApp.Tags = [], MyApp.Campus = [], MyApp.Activities = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? "&hellip;" : "");
};

/* instructions for making a spreadsheet accessible
http://billing.chillidoghosting.com/knowledgebase/48/Publishing-Spreadsheets-to-Google-Docs.html
*/

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/1Yrq7iNjFIUGv9N1DLATs_WlP-i9VUQYqb23lnUaQMJA/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var prog = val.gsx$programs.$t;
            // var desc = val.gsx$description.$t;
            var website = "<a target='_blank' href='" + val.gsx$website.$t + "'><i class='icon-globe'></i> Website</a>";
            // var contacts = val.gsx$contacts.$t;
            // var email = "<a href='mailto:" + val.gsx$email.$t + "'><i class='icon-envelope'></i> Email</a>";
            var tags = val.gsx$tags.$t;
            var campus = val.gsx$campus.$t;
            var activities = val.gsx$activities.$t;

            MyApp.spreadsheetData.push([
                    prog,
                    GenerateDescription(val),
                    website,
                    GenerateContact(val),
                    tags,
                    campus,
                    activities
                  ]);

            parseList(tags, ";", "Tags");
            parseList(campus, ";", "Campus");
            parseList(activities, ";", "Activities");
        });

        MyApp.Tags.sort();
        MyApp.Campus.sort();
        MyApp.Activities.sort();

        createDataTable();
        addFilters();
        configurePopups();
    });
})

function parseList(str, sep, field) {
    $.each(str.trim().replace(/^[\r\n]+|\.|[\r\n]+$/g, "").split(sep), function (key, val) {
        val = val.trim(); //need to trim the semi-colon separated values after split

        if ($.inArray(val, MyApp[field]) === -1 && val.length !== 0) {
            MyApp[field].push(val);
        }
    });
}

// function hideUnavailableOrganizations(){
//     var fileredData = MyApp.oTable._('tr', {"filter":"applied"});
//
//     //Get departments available after the filters are set
//     MyApp.Organizations = [];
//     $.each(fileredData, function (key, val) {
//         var org = val[MyApp.filterIndexes["organizations"]];
//
//         if ($.inArray(org, MyApp.Organizations) === -1 && org.length !== 0) {
//                 MyApp.Organizations.push(org);
//         }
//     });
//
//     // $(":checkbox", "#organizations").each(function () {
//     //     //if a checkbox isn't in the list of available departments, hide it
//     //     if ($.inArray(this.name, MyApp.Organizations) === -1) {
//     //         $(this).parent().css("display", "none");
//     //     } else {
//     //         $(this).parent().css("display", "block");
//     //     }
//     // });
// }


function configurePopups(){
    $("#spreadsheet").popover({
        selector: '.researcher-popover, .project-popover',
        trigger: 'hover'
    });
}

function addFilters(){
    var $tags = $("#tags");

    $.each(MyApp.Tags, function (key, val) {
        $tags.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

    var $campus = $("#campus");

    $.each(MyApp.Campus, function (key, val) {
        $campus.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

    var $activities = $("#activities");

    $.each(MyApp.Activities, function (key, val) {
        $activities.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

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

                filterRegex += val.name; //Use the hat and dollar to require an exact match
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

function GenerateResearcherColumn(val /* entry value from spreadsheet */){
    var name = val.gsx$name.$t;
    var title = val.gsx$positiontitle.$t;

    //var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
    //var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";
    // var allResearchInfo = "Research areas: " + val.gsx$researchareas.$t;
    var allResearchInfo = val.gsx$researchareas.$t;

    var content = allResearchInfo; //could expand content later
    var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";

    return researcher;
}

function GenerateContact(val) {
    var contacts = val.gsx$contacts.$t.trim().split(";");
    console.log(contacts.length);
    var str = "#name#<br /><span class='discreet'>#title#</span>";
    var info = "";
    var re = /([^\[]*)/g;
    var re2 = /\[([^\]]*)\]/g;
    for (k = 0; k < contacts.length; k++){
        if (contacts[k]) {
            var name = re.exec(contacts[k]);
            if (name) {
                info += name[1];
            }

            var title = re2.exec(contacts[k]);
            if (title) {
                info += "<br /><span class='discreet'>" + title[1] + "</span>";
            } else {
                console.log("no title " + contacts[k])
            }
            info += "<br />";
        }
    }
    info += "<a href='mailto:" + val.gsx$email.$t + "'><i class='icon-envelope'></i></a>";
    return info;
}

function GenerateDescription(val /* entry value from spreadsheet */){
    var desc_short = "<span style='font-size: 0.8em;'>" + val.gsx$description.$t.trunc(80) + "</span>";
    var tmp = val.gsx$programs.$t;

    /*replace single-quotes with html code*/
    var desc = val.gsx$description.$t.replace(/'/g, "&#39;");

    var desc_full = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + desc + "' data-original-title='" + tmp + "'>" + desc_short + "</a>";

    return desc_full;
}



function displayCurrentFilters() {
    var $filterAlert = $("#filters");
    //var regionFilter = $("#regions"); // Wrong selector..?

    var filters = "";

    /*
    if (regionFilter){
        filters += "<strong>" + this.name + "</strong>";
    }
    */

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
            { "bVisible": false, "aTargets": [ MyApp.filterIndexes["tag"] ] } //hide the tags column
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}
