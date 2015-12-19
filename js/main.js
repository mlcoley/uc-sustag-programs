.MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Name" }, { "sTitle": "Organization" }, { "sTitle": "Projects" }, { "sTitle": "Contact" }, { "sTitle": "City" }, { "sTitle": "region" }, { "sTitle": "organizations" }, { "sTitle": "researchareas" }
];
MyApp.filterIndexes = { "organizations": 6, "regions": 5, "researcharea" : 7 };
MyApp.Organizations = [], MyApp.Regions = [], MyApp.ResearchAreas = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/0AhTxmYCYi3fpdGRrelZaT2F0ajBmalJzTlEzQU96dUE/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var name = val.gsx$name.$t;
            var dept = val.gsx$departmentprogram.$t + '<br /><span class="discreet">' + val.gsx$organization.$t + '</span>';
            var orgtype = val.gsx$typeoforganization.$t;
            var website = "<a target='_blank' href='" + val.gsx$personalwebsitelink.$t + "'><i class='icon-globe'></i></a>";
            var email = "<a href='mailto:" + val["gsx$email"].$t + "'><i class='icon-envelope'></i></a>";
            var contact = email + ' ' + (val.gsx$personalwebsitelink.$t ? website : '') + '<br />' + val.gsx$telephone.$t;
            var city = "<span class='city'>" + val.gsx$citytown.$t + ', ' + val.gsx$state.$t + "</span>";
            var region = val.gsx$region.$t;
            var researchareas = val.gsx$researchareas.$t;

            // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$researchareas.$t;
            
            MyApp.spreadsheetData.push(
                [
                    GenerateResearcherColumn(val), 
                    dept, 
                    GenerateProjectColumn(val), 
                    contact, city, 
                    region, orgtype, researchareas
                ]);

            if ($.inArray(orgtype, MyApp.Organizations) === -1 && orgtype.length !== 0) {
                MyApp.Organizations.push(orgtype);
            }
            if ($.inArray(region, MyApp.Regions) === -1 && region.length !== 0) {
                MyApp.Regions.push(region);
            }

            /*
            if ($.inArray(keyword, MyApp.keywords) === -1 && keyword.length !== 0) {
                MyApp.keywords.push(keyword);
            }
            */

            /* DOH */
            //Add the keywords, which are semi-colon separated. First trim them and then replace the CRLF, then split.
            $.each(researchareas.trim().replace(/^[\r\n]+|\.|[\r\n]+$/g, "").split(';'), function (key, val) {
                val = val.trim(); //need to trim the semi-colon separated values after split
                
                if ($.inArray(val, MyApp.ResearchAreas) === -1 && val.length !== 0) {
                    MyApp.ResearchAreas.push(val);
                }
            });

            MyApp.ResearchAreas.sort();

        });

        MyApp.Organizations.sort();
        MyApp.Regions.sort();
        //MyApp.keywords.sort();

        createDataTable();
        addFilters();
        configurePopups();
    });
})

function hideUnavailableOrganizations(){
    var fileredData = MyApp.oTable._('tr', {"filter":"applied"});

    //Get departments available after the filters are set
    MyApp.Organizations = [];
    $.each(fileredData, function (key, val) {
        var org = val[MyApp.filterIndexes["organizations"]];

        if ($.inArray(org, MyApp.Organizations) === -1 && org.length !== 0) {
                MyApp.Organizations.push(org);
        }
    });

    // $(":checkbox", "#organizations").each(function () {
    //     //if a checkbox isn't in the list of available departments, hide it
    //     if ($.inArray(this.name, MyApp.Organizations) === -1) {
    //         $(this).parent().css("display", "none");
    //     } else {
    //         $(this).parent().css("display", "block");
    //     }
    // });
}


function configurePopups(){
    $("#spreadsheet").popover({ 
        selector: '.researcher-popover, .project-popover',
        trigger: 'hover'
    });
}



function addFilters(){
    var $organizations = $("#organizations");
    
    $.each(MyApp.Organizations, function (key, val) {
        $organizations.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });


    var $region = $("#regions");
    
    $.each(MyApp.Regions, function (key, val) {
        $region.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });


    var $researcharea = $("#researcharea");
    
    $.each(MyApp.ResearchAreas, function (key, val) {
        $researcharea.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
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
        hideUnavailableOrganizations();
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

function GenerateProjectColumn(val /* entry value from spreadsheet */){
    var project1title = "<span style='font-size: 0.8em;'>" + val.gsx$project1title.$t.trunc(20) + "</span>";
    var project1details = "Status: " + val.gsx$expectedcompletiondate.$t + (val.gsx$linktoprojectwebsite.$t ? "—" + val.gsx$linktoprojectwebsite.$t : '');
    var project1 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project1details + "' data-original-title='" + val.gsx$project1title.$t + "'>" + project1title + "</a>";

    var project2title = "<span style='font-size: 0.8em;'>" + val.gsx$project2title.$t.trunc(20) + "</span>";
    var project2details = "Status: " + val.gsx$expectedcompletiondate_2.$t + (val.gsx$linktoprojectwebsite_2.$t ? "—" + val.gsx$linktoprojectwebsite_2.$t : '');
    var project2 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project2details + "' data-original-title='" + val.gsx$project2title.$t + "'>" + project2title + "</a>";

    var project3title = "<span style='font-size: 0.8em;'>" + val.gsx$project3title.$t.trunc(20) + "</span>";
    var project3details = "Status: " + val.gsx$expectedcompletiondate_3.$t + (val.gsx$linktoprojectwebsite_3.$t ? "—" + val.gsx$linktoprojectwebsite_3.$t : '');
    var project3 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project3details + "' data-original-title='" + val.gsx$project3title.$t + "'>" + project3title + "</a>";

    var projects = project1 + (val.gsx$project2title.$t ? project2 : '') + (val.gsx$project3title.$t ? project3 : '');
        
    var allResearchInfo = val.gsx$researchareas.$t;

    // var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";
        
    return projects;
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
            { "bVisible": false, "aTargets": [ -2, -3, -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}
