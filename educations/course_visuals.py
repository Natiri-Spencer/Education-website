"""Local visual catalogue and defaults for the user-supplied mathematics scheme."""

DIAGRAMS = {
    "expressions": ("Terms and expressions", "In 3x + 2, 3 is the coefficient, x is the variable and 2 is the constant. With x = 4, the expression equals 14."),
    "equations": ("Balanced equations", "The equation 2x + 4 = 12 stays balanced when 4 is subtracted from both sides. Then 2x = 8; dividing both sides by 2 gives x = 4."),
    "inequality": ("Simple inequality number line", "For x < 3, an open circle excludes 3 and the ray extends left to smaller values. For x >= 3, a filled circle includes 3 and the ray extends right."),
    "compound": ("Compound inequality interval", "The interval -2 <= x < 4 includes -2, excludes 4 and contains all values between them, including fractions."),
    "right_triangle": ("Sides of a right triangle", "A right triangle has perpendicular sides 3 cm and 4 cm. The opposite side, 5 cm long, is the hypotenuse. The right-angle mark identifies the perpendicular sides."),
    "pythagoras": ("Squares on a right triangle", "Squares on the 3 cm and 4 cm sides have areas 9 and 16 square centimetres. Together they equal the 25 square centimetre square on the 5 cm hypotenuse."),
    "length": ("Metric length conversions", "One kilometre equals 1000 metres, one metre equals 100 centimetres and one centimetre equals 10 millimetres. Multiply toward smaller units and divide toward larger units."),
    "length_operations": ("Adding and sharing lengths", "Two lengths, 2 m 75 cm and 1 m 60 cm, total 435 cm or 4 m 35 cm. Four equal 131 cm lengths reconstruct a 524 cm length."),
    "perimeter": ("A rectangle's boundary", "An 8 cm by 5 cm rectangle has boundary lengths 8, 5, 8 and 5 cm. Their sum, 26 cm, is the perimeter; its 40 square centimetre area is a different quantity."),
    "circumference": ("Radius, diameter and circumference", "A circle of radius 7 cm has diameter 14 cm. Its circumference is 44 cm when pi = 22/7. The circumference follows the curved boundary."),
    "land": ("Land-area units", "A 100 m by 100 m square covers 10,000 square metres or one hectare. An acre is approximately 4046.86 square metres; classroom questions may explicitly use a rounded approximation."),
    "rectangle": ("Rectangle area", "A rectangle 8 cm long and 5 cm wide contains 40 one-square-centimetre cells. Area is length times width and is measured in square units."),
    "parallelogram": ("Parallelogram base and height", "The perpendicular height, 5 cm, is different from the sloping side. A base of 12 cm and height of 5 cm give area 60 square centimetres."),
    "rhombus": ("Rhombus diagonals", "A rhombus has perpendicular diagonals of 10 cm and 8 cm. Its area is half their product, 40 square centimetres. Diagonals join opposite vertices."),
    "trapezium": ("Trapezium parallel sides", "A trapezium has parallel sides 8 cm and 14 cm, separated by perpendicular height 5 cm. Its area is (8 + 14) times 5 divided by 2, or 55 square centimetres."),
    "circle_area": ("Area inside a circle", "A circle of radius 7 cm has area 154 square centimetres using pi = 22/7. The shaded interior is the area; the outer curve is the circumference."),
    "border": ("A rectangular border", "A 10 m by 6 m garden with a 1 m path outside has outer dimensions 12 m by 8 m. Path area is 96 minus 60, or 36 square metres."),
    "composite": ("An L-shaped area", "Removing a 3 m by 2 m corner from an 8 m by 6 m rectangle leaves an L shape. Its area is 48 minus 6, or 42 square metres."),
    "cubic_units": ("Cubic metric units", "A cube with edges 1 m has edges 100 cm. Its volume is 100 times 100 times 100 cubic centimetres, so 1 cubic metre equals 1,000,000 cubic centimetres."),
    "cube": ("Cube volume", "A cube with each edge 5 cm has volume 5 times 5 times 5, or 125 cubic centimetres. Three lengths are multiplied; volume uses cubic units."),
    "cuboid": ("Cuboid volume", "A cuboid with length 12 cm, width 8 cm and height 5 cm has volume 480 cubic centimetres. Its base area is 96 square centimetres."),
    "cylinder": ("Cylinder volume", "A cylinder of radius 7 cm and height 10 cm has volume pi times 7 squared times 10, or 1540 cubic centimetres when pi = 22/7."),
    "capacity": ("Capacity and current contents", "A tank with inside dimensions 40 by 25 by 30 cm has capacity 30 litres. Water 18 cm deep occupies 18 litres. Capacity is the full amount it can hold, not the current contents."),
    "clock": ("Reading a clock", "At 3:20 the minute hand points to 4 and the hour hand has moved a third of the way from 3 to 4. Twenty minutes is a duration; 3:20 is a time of day."),
    "time": ("Time conversion chain", "One hour equals 60 minutes or 3600 seconds. Multiply by 60 at each step toward smaller units; divide by 60 in reverse. Half an hour is 30 minutes or 1800 seconds."),
    "distance": ("Distance in common units", "A route of 2 km 75 m is 2075 m or 2.075 km. Change both distances to the same unit before adding or comparing them."),
    "speed": ("Distance, time and speed", "Travelling 180 km in 3 hours gives an average speed of 60 km/h. That is approximately 16.67 m/s. Average speed is total distance divided by total time."),
    "thermometer": ("Reading temperature", "The thermometer scale runs from 0 to 40 degrees Celsius in 5-degree steps. The shown reading is 25 degrees Celsius; a higher reading means a warmer temperature."),
    "temperature_scales": ("Celsius and kelvin scales", "Aligned scales show 0 degrees Celsius = 273.15 kelvin and 25 degrees Celsius = 298.15 kelvin. School exercises may explicitly round the offset to 273."),
    "temperature_change": ("Reading versus temperature change", "A rise from 18 to 27 degrees Celsius is 9 degrees Celsius. On the kelvin scale, the rise is 9 K too. No 273 offset is added to a temperature change."),
    "profit": ("Profit from a sale", "An item costs KES 800 and sells for KES 950. The KES 150 difference is profit. Cost price plus profit equals selling price."),
    "loss": ("Loss from a sale", "An item costs KES 2400 and sells for KES 2100. The KES 300 difference is loss. Selling price plus loss equals cost price."),
    "percentage": ("Percentage on a stated base", "A KES 500 cost price and KES 100 profit give percentage profit 100 divided by 500 times 100%, or 20%. The base is cost price, not selling price."),
    "discount": ("Discount and sale price", "For a marked price of KES 2500 and a 12% discount, the discount is KES 300 and the sale price is KES 2200. The percentage base is marked price."),
    "fractions": ("Fraction, decimal and percentage", "Two of four equal parts are shaded: 2/4 = 1/2 = 0.5 = 50%. The whole must be split into equal parts."),
    "decimals": ("Decimal place value", "In 2.35, the digits mean 2 ones, 3 tenths and 5 hundredths: 2 + 3/10 + 5/100."),
    "review": ("Choose a method and check units", "For a rectangle 2.4 m long and 150 cm wide, first convert 150 cm to 1.5 m. Its perimeter is 7.8 m and its area is 3.6 square metres. Different questions need different units."),
}
DIAGRAM_CHOICES = tuple((key, value[0]) for key, value in DIAGRAMS.items())
SIMULATION_CHOICES = (("equations", "Equation balance"), ("inequalities", "Inequality number line"), ("area", "Area explorer"), ("volume", "Volume and capacity explorer"))

SLOTS = {
    1: ["expressions", "equations", "equations", "equations", "equations"],
    2: ["inequality", "inequality", "inequality", "inequality", "compound"],
    3: ["compound", "right_triangle", "pythagoras", "length", "length_operations"],
    4: ["length_operations", "length_operations", "length_operations", "perimeter", "circumference"],
    5: ["land", "rectangle", "parallelogram", "rhombus", "trapezium"],
    6: ["circle_area", "border", "composite", "cubic_units", "cubic_units"],
    7: ["cubic_units", "cube", "cuboid", "cylinder", "capacity"],
    9: ["capacity", "clock", "time", "time", "time"],
    10: ["time", "time", "time", "distance", "distance"],
    11: ["speed", "speed", "speed", "speed", "thermometer"],
    12: ["thermometer", "thermometer", "temperature_scales", "temperature_scales", "temperature_change"],
    13: ["profit", "loss", "percentage", "percentage", "discount"],
    14: ["review"],
}
AREA_SHAPES = {"rectangle": "rectangle", "parallelogram": "parallelogram", "rhombus": "rhombus", "trapezium": "trapezium", "circle_area": "circle", "border": "border", "composite": "composite"}
VOLUME_SHAPES = {"cubic_units": "cube", "cube": "cube", "cuboid": "cuboid", "cylinder": "cylinder", "capacity": "cuboid"}


def defaults_for_diagram(key):
    simulation = ""
    if key == "equations":
        simulation = "equations"
    elif key in ("inequality", "compound"):
        simulation = "inequalities"
    elif key in AREA_SHAPES:
        simulation = "area"
    elif key in VOLUME_SHAPES:
        simulation = "volume"
    return {"diagram_kind": key, "simulation_kind": simulation}


def visual_for_slot(week, number):
    return defaults_for_diagram(SLOTS[week][number - 1])


def module_visual(module):
    metadata = DIAGRAMS.get(module.diagram_kind)
    simulation = module.simulation_kind if module.simulation_kind in dict(SIMULATION_CHOICES) else ""
    if not metadata and not simulation:
        return None
    return {
        "title": metadata[0] if metadata else "Interactive activity",
        "description": module.diagram_caption or (metadata[1] if metadata else ""),
        "path": f"educations/course_diagrams/{module.diagram_kind}.svg" if metadata else "",
        "simulation": simulation,
        "shape": AREA_SHAPES.get(module.diagram_kind, "rectangle") if simulation == "area" else VOLUME_SHAPES.get(module.diagram_kind, "cuboid"),
        "compound": module.diagram_kind == "compound",
    }
