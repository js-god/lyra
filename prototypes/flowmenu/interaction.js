var svgm; //stores all active intermediate objects
var marks=[]; //intermediate link between the data, d3, and its dropzones
var markcount=0; //number of marks on screen

var dataset = [];
var zonewidth=50;
var n;
var allData=[];
var markGroups=[];

function MarkGroup(type)
{
	this.scales = {}; // maps visual property -> scale object
	this.majorParameter = undefined;
	this.range= 50;
	this.type=type;
	
	this.addScale = function(property, newscale)
	{
		this.scales[property] = newscale;
	}

}
function Scale(scaleobj, colorscale, type, columnName)
{
	this.scaleobj = scaleobj;
	this.colorscale = colorscale;
	this.type = type;
	this.columnName = columnName;
}

var menus = {"rect":
							{"height":
								["linear","logarithmic"],
							"width":
								["linear","logarithmic"],
							"fill":
								["Pallet A","Pallet B","Pallet C"],
							"stroke":
								["Pallet A","Pallet B","Pallet C"]}, 
						"arc":
							{"angle":
								["linear","logarithmic"],
							"inner radius":
								["linear","logarithmic"],
							"outer radius":
								["linear","logarithmic"],
							"fill":
								["Pallet A","Pallet B","Pallet C"],
							"stroke":
								["Pallet A","Pallet B","Pallet C"]}};


var menulabels;
var extents;


function dataObjectsToColumn(objectArray,colname){
	var column=[];
	for(var i in objectArray) {
		column.push(objectArray[i][colname]);
	}
	return column;
}




$(document).ready(function(){
		
	//$.getJSON("./olympics.json",function(response){
	
	//Read in Data from CSV File
	d3.csv("./olympics.csv", function(response) {
		//console.log(response);
		
		//use d3 loader instead?
		for (var i in response) {
			allData[i]={};
			for(var attr in response[0]) {
				if(attr==="ISO Country code" || attr === "Country name" || attr === "Continent") {
					allData[i][attr] = response[i][attr];
				} else {
					allData[i][attr] = +response[i][attr]; //data holds number
				}
			}
		}
		
		//n=allData.length;
//		allData.push(allData[0]); //push a fake piece of data on the end to serve as the chart selector. What is this?
		console.log(allData);
		
		//populate list of columns
		for(var label in allData[0]) {
			var newelement=$("<li class=\"column\"></li>");
			newelement.text(label);
			newelement.appendTo($("#data ul"));
		}
		
		//Column class for each variable in the data
		$(".column").draggable({
			start:function(event,ui){
				$(".menudiv").show(); //show available attribute encoders
			},
			stop:function(event,ui){
				$(".menudiv").hide(500); //necessary or drop won't register
			}
		})
		.draggable("option","helper","clone");
	});
	
	
	//Mark boxes at top of screen	
  $(".mark").draggable()
						.draggable("option", "revert", "invalid") 
						.draggable("option", "helper", "clone"); //duplicate of draggable moves with cursor

	//Region is everything below the marks div								
  $("#region").droppable({
			accept: ".mark",
			drop: function( event, ui ) {
				var x,y;
				var dragged=ui.draggable;
				var visarea = $("#vis");
				x=event.pageX - visarea.offset().left;
				y=event.pageY - visarea.offset().top;
				xmlns = "http://www.w3.org/2000/svg";
				
				if(dragged.hasClass("mark")) {
					var markID = $(dragged).attr("id").split("_")[1];
					svgm = d3.select("svg#vis");
	
					dataset=[];
					n=allData.length;
					console.log(n);
					for(var i=0; i<n;i++) dataset.push(1);
	
					// make mark svg element group and elements
					createMarks(x,y,markcount,markID);

					//make a 1st level menu for each graph
					createMenus(markID,markcount);

					// global mark index
					markcount++;					
				}
			}
	});

});






var createMenus=function(markID,markcount) {
	console.log(markID);
	
	var menudivs=[];
	menulabels=d3.keys(menus[markID]);
	
	var menuitem;
	console.log(menulabels);
	
	for (var divnum=0; divnum<menulabels.length; divnum++) {
		menuitem=$("<div class=\"menudiv"+divnum+" menudiv\" id=\"menudiv_"+markcount+"_"+divnum+"\" style=\"position:absolute;\">"+menulabels[divnum]+ "</div>");
		
		menudivs.push(menuitem);
		menuitem.appendTo($("body"));
		menuitem.hide();
		
		//move menu item to rect
		var myid = menuitem.attr("id");
		var marknum = myid.split("_")[1];
		var menuindex = myid.split("_")[2];
		var markgroup = d3.select(".mark"+marknum);		
		//var attachedmarks = markgroup.selectAll("rect");
		var cleantrans = markgroup.attr("transform").substring(10).split(")")[0].split(",");
		var minx = +cleantrans[0];
		var maxy = +cleantrans[1];
		var visarea = $("#vis");
		 
		menuitem.css("left",(minx+visarea.offset().left)+"px");
		menuitem.css("top",maxy+visarea.offset().top+120+menuindex*20+"px");
		
		menuitem.droppable({
		
			accept: ".column",
			drop: function(event,ui){
				// TODO take default behavior
			},
			activate:function(event,ui){ },
			over:function(event,ui){
				var mytext = d3.select(this);
				var myid = mytext.attr("id");
				var marknum = myid.split("_")[1];
				var menuindex = myid.split("_")[2];
				mytext.classed("hoverselected",true);
				// reveal next level
				$(".optiondiv").hide();
				$(".optiondiv_"+marknum+"_"+menuindex).show();
			},
			out:function(event,ui){
				var mytext = d3.select(this);
				mytext.classed("hoverselected",false);
				//hide other elements
			}
			
		});
		
		menuitem.droppable("option","tolerance","pointer");
		
		// make a 2nd level menu for each 1st level menu
		var optionslist = menus[markID][menulabels[divnum]];
		for(var optionnum=0; optionnum<optionslist.length; optionnum++) {
			option=$("<div class=\"optiondiv_"+markcount+"_"+divnum+" optiondiv\" id=\"optiondiv_"+markcount+"_"+divnum+"_"+optionnum+"\" style=\"position:absolute;\">"+optionslist[optionnum]+ "</div>");
			option.appendTo($("body"));
			option.hide();

			var myid = option.attr("id");
			var marknum = myid.split("_")[1];
			var menuindex = myid.split("_")[2];
			var myparent = d3.select("#menudiv_"+marknum+"_"+menuindex);
			var parentX = +(myparent.style("left").split("px")[0]);
			var parentY = +(myparent.style("top").split("px")[0]);
			var visarea = $("#vis");
			
			option.css("left",(parentX+zonewidth*2)+"px");
			option.css("top",parentY+optionnum*20+"px");
			
			option.droppable({
				accept: ".column",
				drop:dropSubMenu,
				activate:function(event,ui){},
				deactivate:function(event,ui){
					$(this).hide(500);
				},
				over:function(event,ui){}
			});
			
			option.droppable("option","tolerance","touch");
		}
	}
}





var createMarks=function(x,y,markcount,type) {
	
	switch(type) {
		
		case "rect":
			var rectcont = svgm.append("g")
			.classed("mark"+markcount,true)
			.classed("rectmark",true)
			.attr("transform", "translate(" + x + "," + y + ")")
			.attr("fill", "steelblue")
			.attr("stroke","#ccc")
			.attr("stroke-width","2")
			.attr("id","mark_"+markcount+"_group");
	
			rectcont.selectAll("rect")
			.data(dataset)
			.enter()
			.append("rect")
			.attr("height",100)
			.attr("width",50)
			.attr("x",0)
			.attr("y",0)	
			.attr("fill", function(d,i) {
				return "steelblue"; })
			.attr("fill-opacity", function(d,i) {
				return 1; })
// 			.attr("stroke", function(d,i) {
// 				if(i==n-1) { return "#000"; }
// 				return "#ccc"; })
			.attr("stroke-width", function(d,i) {
				return 2; })
			.classed("realmark",true);
			
			rectcont.append("rect")
			.classed("container",true);
			
			markGroups.push(new MarkGroup("rect"));
			break;
		
		case "arc":
			var donut = d3.layout.pie(),
			arc = d3.svg.arc().innerRadius(0).outerRadius(50);
	
			var arcscont=svgm.append("g")
				.data([dataset])
				.attr("class","mark"+markcount)
				.classed("arcmark",true)
				.attr("transform", "translate(" + x + "," + y + ")")
				.attr("stroke","#ccc")
				.attr("stroke-width","2")
				.attr("id","mark_"+markcount+"_group");	
				
			arcscont.append("circle")
			.classed("container",true);	
			
			var arcs=arcscont
				.selectAll(".mark"+markcount+" g.arc")
				.data(donut)
				.enter().append("g")		
				.attr("class", "arc");
				
			arcs.append("path")
				.attr("fill", "steelblue")
				.attr("d", arc)
				.classed("realmark",true);
			markGroups.push(new MarkGroup("arc"));
			break;
	}
	
	mouseX = 0;
	mouseY = 0;
	groupX = 0;
	groupY = 0;
	groupW = 0;
	groupH = 0;
	groupSX = 1;
	groupSY = 1;
	isDragging = false;
	
	$("g.mark" + markcount).draggable({
		drag: function(e, ui) {
			$('body').css('cursor', scaleMode);
			tSpecs = transformSpecs(e.target);
			
			dx = parseInt(ui.position.left - mouseX);
			dy = parseInt(ui.position.top - mouseY);
			
			//console.log(groupX + " + " + ui.position.left + " - " + mouseX + " = " + parseInt(groupX+dx));
			//console.log("DRAG: " + ui.position.left);
			var target;
			target=d3.select(this)
			
			if(target.classed("rectmark")) {
				switch(scaleMode) {
					case "move":
						t = "translate(" + parseInt(groupX+dx) + "," + parseInt(groupY+dy) + ") ";
						t += "scale(" + tSpecs[2] + "," + tSpecs[3] + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "e-resize":
						sx = (groupW+dx)/groupW;
						t = "translate(" + tSpecs[0] + "," + tSpecs[1] + ") ";
						t += "scale(" + sx*groupSX + ", " + tSpecs[3] + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "w-resize":
						sx = (groupW-dx)/groupW;
						t = "translate(" + parseInt(groupX+dx) + "," + tSpecs[1] + ") ";
						t += "scale(" + sx*groupSX + ", " + tSpecs[3] + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "n-resize":
						sy = (groupH-dy)/groupH;
						t = "translate(" + tSpecs[0] + "," + parseInt(groupY+dy) + ") ";
						t += "scale(" + tSpecs[2] + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "s-resize":
						sy = (groupH+dy)/groupH;
						t = "translate(" + tSpecs[0] + "," + tSpecs[1] + ") ";
						t += "scale(" + tSpecs[2] + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "se-resize":
						sx = (groupW+dx)/groupW;
						sy = (groupH+dy)/groupH;
						t = "translate(" + tSpecs[0] + "," + tSpecs[1] + ") ";
						t += "scale(" + sx*groupSX + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "ne-resize":
						sx = (groupW+dx)/groupW;
						sy = (groupH-dy)/groupH;
						t = "translate(" + tSpecs[0] + "," + parseInt(groupY+dy) + ") ";
						t += "scale(" + sx*groupSX + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
						
					case "sw-resize":
						sx = (groupW-dx)/groupW;
						sy = (groupH+dy)/groupH;
						t = "translate(" + parseInt(groupX+dx) + "," + tSpecs[1] + ") ";
						t += "scale(" + sx*groupSX + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
					
					case "nw-resize":
						sx = (groupW-dx)/groupW;
						sy = (groupH-dy)/groupH;
						t = "translate(" + parseInt(groupX+dx) + "," + parseInt(groupY+dy) + ") ";
						t += "scale(" + sx*groupSX + ", " + sy*groupSY + ")";
						$(e.target).attr("transform", t);
						break;
								
					default:
						console.log("NADA");
				}
			}
			else if(target.classed("arcmark")) {
				switch(scaleMode) {
					case "move":
						t = "translate(" + parseInt(groupX+dx) + "," + parseInt(groupY+dy) + ") ";
						t += "scale(" + tSpecs[2] + "," + tSpecs[3] + ")";
						$(e.target).attr("transform", t);
						break;						
					default:
										var visarea = $("#vis");	 		
					console.log(e.pageY + " " + ui.position.top + " " + groupY + " " + visarea.offset().top);
					
					// ui.position.left/top is EVIL
					
					var	clickDist = Math.sqrt(Math.pow(groupX+visarea.offset().left-e.pageX,2)+Math.pow(groupY+visarea.offset().top-e.pageY,2));
					var marknum = $(this).attr("id").split("_")[1];
						updateMarks(marknum, clickDist);
						break;
				}
				var marknum = $(this).attr("id").split("_")[1];
				console.log($(this).attr("id"));
				updateBackgroundHighlight(marknum, .3);
			}
		},
				
		
		start: function(e, ui) {
//			console.log("-START");
			isDragging = true;
			
			tSpecs = transformSpecs(e.target);
			wh = getDimensions($(e.target));
			
			mouseX = parseInt(ui.position.left); // Fix?
			mouseY = parseInt(ui.position.top);

			groupX = parseInt(tSpecs[0]);
			groupY = parseInt(tSpecs[1]);
			
			groupW = wh[0]*tSpecs[2];
			groupH = wh[1]*tSpecs[3];
			
			groupSX = tSpecs[2];
			groupSY = tSpecs[3];
			
		},
		
		
		stop: function(e, ui) {
//			console.log("-STOP");
			isDragging = false;
			
			//note new width/height
			tSpecs = transformSpecs(this);
			wh = getDimensions($(this));
		  
//			console.log("STOP");
			groupW = wh[0]*tSpecs[2];
			groupH = wh[1]*tSpecs[3];
			
			groupSX = tSpecs[2];
			groupSY = tSpecs[3];
    }})
      
    
    .mousedown(function(e) {
	    //append target to front of the group so it is in the front
	    //$(e.target).parent().append(e.target);
//	    console.log("-MDOWN");
	  })
	  
	  
	  .mouseover(function(e) {
//		  console.log("OVER");
		  if(!isDragging) {
			  tSpecs = transformSpecs(this);
				wh = getDimensions($(this));
				groupW = wh[0]*tSpecs[2];
				groupH = wh[1]*tSpecs[3];
			}
			var marknum = $(this).attr("id").split("_")[1];
			console.log($(this).attr("id"));
			updateBackgroundHighlight(marknum, .3);
	  })
	  
	  
	  .mousemove(function(e) {
		  tSpecs = transformSpecs(this);
			
			//console.log(e.offsetX);
			//console.log(groupW + " | " + groupH);
			//console.log(s[1] + "|" + s[2] + "|" + wh[0] + "|" + wh[1] + "|" + e.offsetX + "|" + e.offsetY);
			
			if(!isDragging) {
				getCursorType(tSpecs[0], tSpecs[1], groupW, groupH, e.offsetX, e.offsetY);
			}
	  })
	  
	  
	  .mouseout(function(e) {
		  $('body').css('cursor', 'auto');
		var marknum = $(this).attr("id").split("_")[1];
		updateBackgroundHighlight(marknum, 0);
	  });

}


var scaleMode = "";



//Determine cursor type for moving/scaling
function getCursorType(shapeX, shapeY, shapeW, shapeH, mouseX, mouseY) {
	pX = (mouseX-shapeX)/shapeW; //percentage of X shape
	pY = (mouseY-shapeY)/shapeH; //percentage of Y shape
	var boundaryWidth = .1;
	
	if(pX<boundaryWidth && pY<boundaryWidth) {
		scaleMode = "nw-resize";		
	} else if(pX<boundaryWidth && pY>(1-boundaryWidth)) {
		scaleMode = "sw-resize";
	} else if(pX<boundaryWidth) {
		scaleMode = "w-resize";
	} else if(pX>(1-boundaryWidth) && pY<boundaryWidth) {
		scaleMode = "ne-resize";
	} else if(pX>(1-boundaryWidth) && pY>(1-boundaryWidth)) {
		scaleMode = "se-resize";
	} else if(pX>(1-boundaryWidth)) {
		scaleMode = "e-resize";
	} else if(pY<boundaryWidth) {
		scaleMode = "n-resize";
	} else if(pY>(1-boundaryWidth)) {
		scaleMode = "s-resize";
	} else {
		scaleMode = "move";
	}
	
	$('body').css('cursor', scaleMode);	
}


//Get specs from transform attribute of g group
function transformSpecs(shape) {
	t = $(shape).attr("transform");
	p = /\(|\)|\,/g;
	s = t.split(p);
	
	//translateX, translateY, scaleX (default:1), scaleY (default:1)
	if(s.length<5) {
		return [s[1], s[2], 1, 1];
	} else {
		return [s[1], s[2], s[4], s[5]];
	}
}


/*
//Get the width and height of g group based on its SVG elements (only works for rect now)
function getDimensions(shapes) {
	mode = -1; //0 = bar graph horizontal; 1 = bar graph vertical
	
	maxW = +$(shapes).eq(0).attr("width");
	maxH = +$(shapes).eq(0).attr("height");
	
	
	//bar graph with bars of same width or same height?
	for(i=1; i<shapes.length-1; i++) {
		if(maxH !== +$(shapes).eq(i).attr("height")) {
			mode = 0;
			break;
		} else if(maxW !== +$(shapes).eq(i).attr("width")) {
			mode = 1;
			break;
		}
	}
	
	if(mode==-1) { return [maxW, maxH]; }
	
	maxW = 0, maxH = 0;

	//determine width and height of parent by finding max W/H or cumulative W/H
	for(i=0; i<shapes.length-1; i++) {
		if(mode==0) {
			maxW += +$(shapes).eq(i).attr("width");
			maxH = Math.max(maxH, +$(shapes).eq(i).attr("height"));
		}
		if(mode==1) {
			maxW = Math.max(maxW, +$(shapes).eq(i).attr("width"));
			maxH += +$(shapes).eq(i).attr("height");
		}
	}
	
	return [maxW, maxH];
}
*/

// get svg group bounding box
function getDimensions(shapes) {
	shapes=shapes[0];
	var bb = shapes.getBBox();
	return [bb["width"], bb["height"]];
}


// handle dropped column onto menu label and
// update marks
var dropSubMenu=function(event,ui){
	//switch based on parent menu type
	var option = $(this);
	var myid = option.attr("id");
	var s = myid.split("_");
	
	//high-level mark, first-level menu, second-level menu option
	var marknum = s[1], menuindex = s[2], optionindex = s[3];
	var myparent = d3.select("#menudiv_"+marknum+"_"+menuindex);
	
	console.log("DROP "  + menulabels[menuindex]+" "+option.text());
	
	var parameter = menulabels[menuindex]; //second-level menu option
	var colname = ui.draggable.text(); //column name of data
	
	//Set scales to either linear or logarithmic
	var scaleselection = option.text();
			
	console.log("dropped "+ colname + " on mark"+marknum);	
	
	updateMarks(marknum, 100, parameter, colname, scaleselection);
	

}

// mark number, visual property, column name, type of scale
var updateMarks = function(marknum, range, parameter, colname, scaleselection)
{

	var yscale;
	var colorscale;
	var nodeType;
	var dragupdate=false;
	var transduration = 250;
	
	d3.select(".mark"+marknum+" .realmark").each(function(d,i){nodeType=this.nodeName;}); 
	
	range = Math.floor(range);
	markGroups[marknum].range = range;
	// use established values if scale update
	
	// resize default
	if(markGroups[marknum].majorParameter === undefined && colname === undefined && scaleselection === undefined && parameter === undefined)
	{
		if(nodeType === "rect")
		{
		
		}
		else if(nodeType === "path")
		{
			var marks=svgm.selectAll("g.mark"+marknum)
										.data([allData]);
			var arc = d3.svg.arc();
			arc.innerRadius(0);
			arc.outerRadius(range);
			marks.selectAll("path")
				.attr("d", arc); 				
		}
	}
	else
	{
		// regular update
		if(colname === undefined && scaleselection === undefined && parameter === undefined)
		{
			parameter = markGroups[marknum].majorParameter;
			colname = markGroups[marknum].scales[parameter].columnName;
			scaleselection = markGroups[marknum].scales[parameter].type;		
			dragupdate=true;
			transduration=0;
		}
		
		var datacolumn = dataObjectsToColumn(allData,colname);
		var extents = d3.extent(datacolumn); 
		
		console.log(parameter + " " + colname + " " + scaleselection);

		// set up scale based on menu choice	
		switch(scaleselection) {
			case "linear":
				yscale = d3.scale.linear()
					.domain(extents)
					.range([0, range]);
				break;
			
			case "logarithmic":
				if(extents[0]<=0) extents[0]=1; //how to deal with zeroes?
				yscale = d3.scale.log()
					.domain(extents)
					.range([0, range]);
				break;
			
			default: 
				var palletselection = scaleselection.split(" ")[1];
				switch(palletselection) {
					case "A": 
						colorscale=d3.scale.category20().domain(datacolumn);
						break;
					case "B":
						colorscale=d3.scale.category20b().domain(datacolumn);
						break;
					case "C":
						colorscale=d3.scale.category20c().domain(datacolumn);
						break;
				}
		}
		

		
		var logextra;
		logextra = scaleselection==="logarithmic" ? 1 : 0;

		svgm = d3.select("svg#vis");

		switch(nodeType) {
			case "rect":
				var marks=svgm.selectAll(".mark"+marknum+" .realmark")
											.data(allData);
				switch(parameter) {
					case "height":
						marks.transition().duration(transduration)
							.attr("height",function(d,i){
								return yscale(d[colname]+logextra);})
							.attr("width",function(d,i) {
								return 20;})
							.attr("x",function(d,i){
								return i*20;})
							.attr("y",function(d,i){
								return range-yscale(d[colname]+logextra);});
						break;
						
					case "width":
						marks.transition().duration(transduration)
							.attr("width",function(d,i){
								return yscale(d[colname]+logextra);})
							.attr("height", function(d,i) {
								return 20;})
							.attr("x",function(d,i){return 0;})	
							.attr("y",function(d,i){
								return i*20;});
						break;
					
					case "fill":
						marks.attr("fill",function(d,i){return colorscale(d[colname]);})		
						break;
						
					case "stroke":
						marks.attr("stroke",function(d,i){return colorscale(d[colname]);})
						break;
				}
				break;
			case "path":
				
				var arc = d3.svg.arc();
				var marks=svgm.selectAll("g.mark"+marknum)
											.data([allData]);
				
				switch(parameter) {
					case "angle":
						arc.innerRadius(0);
						arc.outerRadius(range);
						
						sum = 0;
						cum = new Array();
						cum[0] = 0;
						for(i=0; i<n-1; i++) {
							sum += yscale(datacolumn[i]+logextra);
							cum[i+1] = sum;
						}
						cum[n] = sum;
						
						arc.startAngle(function(d,i) {
							return cum[i]/sum*2*Math.PI;
						})
						arc.endAngle(function(d,i) {
							return cum[i+1]/sum*2*Math.PI;
						})
						
						marks.selectAll("path").transition().duration(transduration)
							.attr("d", arc); 	
						break;
						
					case "inner radius":
						
						arc.outerRadius(range);
						arc.innerRadius(function(d,i){
							return yscale(datacolumn[i]+logextra);
						});
						marks.selectAll("path").transition().duration(transduration)
							.attr("d", arc); 						
						break;
					
					case "outer radius":
						arc.innerRadius(0);
						arc.outerRadius(function(d,i){
							return yscale(datacolumn[i]+logextra);
						});
						marks.selectAll("path").transition().duration(transduration)
							.attr("d", arc); 			
						break;
						
					case "fill":
						marks.attr("fill",function(d,i){return colorscale(d[colname]);})
						break;
						
					case "stroke":
						marks.attr("stroke",function(d,i){return colorscale(d[colname]);})
						break;
				}
		}
		
		markGroups[marknum].addScale(parameter, new Scale(yscale, colorscale, scaleselection, colname));

		if($.inArray(parameter, ["outer radius", "inner radius", "angle", "height", "width"])!==-1) { markGroups[marknum].majorParameter = parameter; }
		
		marks.exit().remove();
	
	}

}

var updateBackgroundHighlight=function(marknum, opacity)
{
	var group = svgm.select("g.mark"+marknum);
	
	// set container to 0 size to avoid distorting bounding box
	var container = group.select(".container")
	container.attr("height",0);
	container.attr("width",0);
	
	var bbox = getDimensions($(group[0][0]));
	console.log(bbox);

	if(markGroups[marknum].type==="arc")
	{
		container.attr("r",(markGroups[marknum].range)+5)
		.attr("fill","steelblue")
		.attr("opacity",opacity);
	}
	else if(markGroups[marknum].type==="rect")
	{
		container.attr("width",bbox[0]+10)
		.attr("height",bbox[1]+10)
		.attr("x",-5)
		.attr("y",-5)
		.attr("fill","steelblue")
		.attr("opacity",opacity);	
	}


}

