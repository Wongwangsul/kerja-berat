# Kisah Imam Malik — Pembuka 10 detik: Blender scene build + 3-pass render.
# Passes: plate.png (full scene), glow.png (light-only on black), fg.png (alpha silhouette)
# Env overrides for local testing: KM_W, KM_H, KM_SAMPLES, KM_OUT
import bpy, math, os, random
from mathutils import Vector

random.seed(11)
OUT = os.environ.get("HASIL_DIR", os.path.join(os.getcwd(), "hasil-run"))
os.makedirs(OUT, exist_ok=True)
RES_X = int(os.environ.get("KM_W", "2560"))
RES_Y = int(os.environ.get("KM_H", "1440"))
SAMPLES = int(os.environ.get("KM_SAMPLES", "384"))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
try:
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception as e:
    print("denoiser fallback:", e)
scene.cycles.volume_bounces = 2
scene.cycles.volume_step_rate = 1.0
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
for look in ('Medium High Contrast', 'None'):
    try:
        scene.view_settings.look = look
        break
    except Exception:
        pass

world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs[0].default_value = (0.010, 0.018, 0.045, 1.0)
bg.inputs[1].default_value = 0.55

# ---------------- material helpers ----------------

def principled(mat):
    return mat.node_tree.nodes['Principled BSDF']

def plaster_mat():
    m = bpy.data.materials.new('Plaster'); m.use_nodes = True
    bsdf = principled(m); nt = m.node_tree
    tex = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (3, 3, 3)
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.0
    nz.inputs['Detail'].default_value = 6.0; nz.inputs['Roughness'].default_value = 0.85
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.25; ramp.color_ramp.elements[0].color = (0.55, 0.43, 0.28, 1)
    ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (0.78, 0.66, 0.48, 1)
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.32
    bump.inputs['Distance'].default_value = 0.5
    nt.links.new(tex.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.96
    return m

def wood_mat(seed_off):
    m = bpy.data.materials.new('Wood%d' % seed_off); m.use_nodes = True
    bsdf = principled(m); nt = m.node_tree
    tex = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (3.0, 0.5, 3.0)
    mp.inputs['Location'].default_value = (seed_off * 3.71, seed_off * 1.37, 0)
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.0
    nz.inputs['Detail'].default_value = 5.0; nz.inputs['Roughness'].default_value = 0.75
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.2; ramp.color_ramp.elements[0].color = (0.115, 0.062, 0.032, 1)
    ramp.color_ramp.elements[1].position = 0.8; ramp.color_ramp.elements[1].color = (0.33, 0.20, 0.105, 1)
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.22
    bump.inputs['Distance'].default_value = 0.3
    nt.links.new(tex.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.82
    return m

def iron_mat():
    m = bpy.data.materials.new('Iron'); m.use_nodes = True
    bsdf = principled(m)
    bsdf.inputs['Base Color'].default_value = (0.045, 0.045, 0.05, 1)
    bsdf.inputs['Metallic'].default_value = 0.85
    bsdf.inputs['Roughness'].default_value = 0.52
    return m

def stone_mat():
    m = bpy.data.materials.new('Stone'); m.use_nodes = True
    bsdf = principled(m); nt = m.node_tree
    tex = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 4.0
    nz.inputs['Detail'].default_value = 5.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.3; ramp.color_ramp.elements[0].color = (0.17, 0.16, 0.145, 1)
    ramp.color_ramp.elements[1].position = 0.7; ramp.color_ramp.elements[1].color = (0.37, 0.34, 0.30, 1)
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 2.6
    mix = nt.nodes.new('ShaderNodeMixRGB'); mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = 0.55
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.4
    bump.inputs['Distance'].default_value = 0.4
    nt.links.new(tex.outputs['Generated'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(tex.outputs['Generated'], vor.inputs['Vector'])
    nt.links.new(ramp.outputs['Color'], mix.inputs[1])
    nt.links.new(vor.outputs['Color'], mix.inputs[2])
    nt.links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(vor.outputs['Distance'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.98
    return m

def rug_mat():
    m = bpy.data.materials.new('Rug'); m.use_nodes = True
    bsdf = principled(m); nt = m.node_tree
    tex = nt.nodes.new('ShaderNodeTexCoord')
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Y'
    wv.inputs['Scale'].default_value = 9.0; wv.inputs['Distortion'].default_value = 2.0
    wv.inputs['Detail'].default_value = 3.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35; ramp.color_ramp.elements[0].color = (0.20, 0.055, 0.04, 1)
    ramp.color_ramp.elements[1].position = 0.65; ramp.color_ramp.elements[1].color = (0.38, 0.22, 0.10, 1)
    nt.links.new(tex.outputs['Generated'], wv.inputs['Vector'])
    nt.links.new(wv.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 1.0
    return m

def dark_mat():
    m = bpy.data.materials.new('FGDark'); m.use_nodes = True
    bsdf = principled(m)
    bsdf.inputs['Base Color'].default_value = (0.016, 0.013, 0.010, 1)
    bsdf.inputs['Roughness'].default_value = 1.0
    return m

def black_mat():
    m = bpy.data.materials.new('PassBlack'); m.use_nodes = True
    bsdf = principled(m)
    bsdf.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1)
    bsdf.inputs['Roughness'].default_value = 1.0
    return m

def emission_mat(color, strength):
    m = bpy.data.materials.new('Emit'); m.use_nodes = True
    nt = m.node_tree
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs[0].default_value = (*color, 1.0)
    em.inputs[1].default_value = strength
    out = nt.nodes['Material Output']
    nt.links.new(em.outputs[0], out.inputs[0])
    return m

def volume_mat():
    m = bpy.data.materials.new('AirVolume'); m.use_nodes = True
    nt = m.node_tree
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = 0.045
    vol.inputs['Color'].default_value = (0.92, 0.86, 0.78, 1)
    try:
        vol.inputs['Anisotropy'].default_value = 0.55
    except Exception:
        pass
    out = nt.nodes['Material Output']
    nt.links.new(vol.outputs[0], out.inputs['Volume'])
    # kill surface
    bsdf = nt.nodes.get('Principled BSDF')
    if bsdf:
        nt.nodes.remove(bsdf)
    return m

PLASTER = plaster_mat(); STONE = stone_mat(); IRON = iron_mat()
RUG = rug_mat(); DARK = dark_mat(); BLACK = black_mat()
WOODS = [wood_mat(i) for i in range(5)]

SCENE_OBJS, FG_OBJS, OCCLUDERS, EMITTERS = [], [], [], []

def box(name, loc, dims, mat, group, occluder=True):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object; o.name = name; o.dimensions = dims
    if mat: o.data.materials.append(mat)
    group.append(o)
    if occluder: OCCLUDERS.append(o)
    return o

# ---------------- architecture ----------------
# Wall with central opening x[-0.75,0.75], y[0,2.6]; front face z=0
box('WallL', (-3.125, 2.3, -0.175), (4.75, 4.6, 0.35), PLASTER, SCENE_OBJS)
box('WallR', ( 3.125, 2.3, -0.175), (4.75, 4.6, 0.35), PLASTER, SCENE_OBJS)
box('Lintel', (0, 3.6, -0.175), (1.5, 2.0, 0.35), PLASTER, SCENE_OBJS)
# Floor
box('Floor', (0, -0.05, 4.6), (14, 0.1, 9.6), STONE, SCENE_OBJS)
# Threshold step
box('Step', (0, 0.05, 0.35), (2.0, 0.1, 0.7), STONE, SCENE_OBJS)
# Rug before the door
box('Rug', (0, 0.012, 0.95), (1.7, 0.024, 1.1), RUG, SCENE_OBJS)
# Door frame jambs (dark wood)
box('JambL', (-0.72, 1.3, 0.0), (0.07, 2.6, 0.42), WOODS[0], SCENE_OBJS)
box('JambR', ( 0.72, 1.3, 0.0), (0.07, 2.6, 0.42), WOODS[0], SCENE_OBJS)
box('JambT', (0, 2.63, 0.0), (1.51, 0.07, 0.42), WOODS[0], SCENE_OBJS)
# Door planks: 5 across, small gaps; total width 1.42 within 1.44 opening
px = -0.71 + 0.14
for i in range(5):
    p = box('Plank%d' % i, (px, 1.29 + random.uniform(-0.002, 0.002), random.uniform(-0.004, 0.004)),
            (0.280, 2.56, 0.07), WOODS[i], SCENE_OBJS)
    px += 0.285
# Iron bands + studs
for y in (0.55, 2.05):
    box('Band', (0, y, 0.052), (1.42, 0.11, 0.02), IRON, SCENE_OBJS)
    for sx in (-0.6, -0.3, 0.0, 0.3, 0.6):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02, location=(sx, y, 0.062))
        s = bpy.context.object; s.scale = (1, 1, 0.5); s.data.materials.append(IRON)
        SCENE_OBJS.append(s); OCCLUDERS.append(s)
# Ring handle
bpy.ops.mesh.primitive_torus_add(major_radius=0.075, minor_radius=0.013,
                                 location=(0.52, 1.32, 0.075), rotation=(0.12, 0, 0))
ring = bpy.context.object; ring.data.materials.append(IRON)
SCENE_OBJS.append(ring); OCCLUDERS.append(ring)
bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.03, location=(0.52, 1.42, 0.055),
                                    rotation=(math.pi / 2, 0, 0))
mount = bpy.context.object; mount.data.materials.append(IRON)
SCENE_OBJS.append(mount); OCCLUDERS.append(mount)

# Lantern on the right wall (faint lamp still burning)
box('LantBracket', (1.95, 2.78, 0.16), (0.05, 0.05, 0.34), IRON, SCENE_OBJS)
bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.15, location=(1.95, 2.58, 0.32))
lant = bpy.context.object; lant.data.materials.append(IRON)
SCENE_OBJS.append(lant); OCCLUDERS.append(lant)
bpy.ops.mesh.primitive_cone_add(radius1=0.085, radius2=0.02, depth=0.07, location=(1.95, 2.69, 0.32))
cap = bpy.context.object; cap.data.materials.append(IRON)
SCENE_OBJS.append(cap); OCCLUDERS.append(cap)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, location=(1.95, 2.58, 0.32))
glass = bpy.context.object
glass.data.materials.append(emission_mat((1.0, 0.62, 0.25), 5.0))
SCENE_OBJS.append(glass); EMITTERS.append(glass)

# ---------------- light sources ----------------
# Blazing dawn plane behind the door
bpy.ops.mesh.primitive_plane_add(location=(0, 1.7, -0.7))
sun = bpy.context.object; sun.dimensions = (5.0, 4.0, 0)
sun.data.materials.append(emission_mat((1.0, 0.52, 0.20), 45.0))
SCENE_OBJS.append(sun); EMITTERS.append(sun)
# Area light blasting through the gaps
bpy.ops.object.light_add(type='AREA', location=(0.4, 2.1, -1.1))
area = bpy.context.object; area.rotation_euler = (math.radians(-14), math.pi, 0)
area.data.energy = 3800; area.data.color = (1.0, 0.60, 0.30)
area.data.shape = 'RECTANGLE'; area.data.size = 2.4; area.data.size_y = 3.0
SCENE_OBJS.append(area)
# Directional spot behind the door: carves defined shafts through the gaps
bpy.ops.object.light_add(type='SPOT', location=(0.35, 2.35, -1.7))
spot = bpy.context.object
_spot_target = Vector((0, 0.25, 2.6))
spot.rotation_euler = (_spot_target - spot.location).to_track_quat('-Z', 'Y').to_euler()
spot.data.energy = 5000; spot.data.color = (1.0, 0.58, 0.28)
spot.data.spot_size = 0.62; spot.data.spot_blend = 0.35
spot.data.shadow_soft_size = 0.4
SCENE_OBJS.append(spot)
# Gentle fake-bounce area on the room side so plaster/floor read in the bright state
bpy.ops.object.light_add(type='AREA', location=(0, 2.3, 5.4))
bounce = bpy.context.object; bounce.rotation_euler = (0, 0, 0)
bounce.data.energy = 9; bounce.data.color = (0.55, 0.60, 0.75)
bounce.data.shape = 'RECTANGLE'; bounce.data.size = 7.0; bounce.data.size_y = 4.0
SCENE_OBJS.append(bounce)
BOUNCE = bounce
# Lantern point light
bpy.ops.object.light_add(type='POINT', location=(1.95, 2.58, 0.38))
pt = bpy.context.object; pt.data.energy = 2.5; pt.data.color = (1.0, 0.62, 0.28)
pt.data.shadow_soft_size = 0.1
SCENE_OBJS.append(pt)
# Faint cool dawn fill near camera
bpy.ops.object.light_add(type='POINT', location=(-2.5, 2.8, 4.5))
fill = bpy.context.object; fill.data.energy = 26; fill.data.color = (0.45, 0.60, 0.95)
fill.data.shadow_soft_size = 1.5
SCENE_OBJS.append(fill)
FILL = fill

# ---------------- volume + dust ----------------
box('Volume', (0, 1.75, 2.6), (7.0, 3.5, 5.2), volume_mat(), SCENE_OBJS, occluder=False)
dust_mat = emission_mat((1.0, 0.80, 0.52), 1.4)
for i in range(90):
    t = random.random()
    cx = 0.15 * t + random.uniform(-0.5, 0.5) * (0.45 + 0.35 * t)
    cy = (2.05 - 1.6 * t) + random.uniform(-0.3, 0.3)
    cz = 0.15 + 2.6 * t + random.uniform(-0.2, 0.2)
    if cy < 0.06: cy = 0.06 + random.random() * 0.2
    if cz > 1.9 and cy < 0.75: cy = 0.75 + random.random() * 0.3
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.003, 0.0075),
                                          location=(cx, cy, cz))
    d = bpy.context.object; d.data.materials.append(dust_mat)
    SCENE_OBJS.append(d); EMITTERS.append(d)

# ---------------- foreground arch (own pass) ----------------
box('FGColL', (-0.80, 1.6, 4.9), (0.55, 3.6, 0.8), DARK, FG_OBJS, occluder=False)
box('FGBeam', (0, 2.30, 4.9), (3.6, 0.55, 0.8), DARK, FG_OBJS, occluder=False)
box('FGColR', (0.88, 1.6, 5.05), (0.45, 3.6, 0.7), DARK, FG_OBJS, occluder=False)

# ---------------- camera ----------------
bpy.ops.object.camera_add(location=(0, 1.62, 6.4))
cam = bpy.context.object
target = Vector((0, 1.35, 0))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 38
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 6.55
cam.data.dof.aperture_fstop = 2.6
scene.camera = cam

# ---------------- render passes ----------------
def render(name, fmt='PNG', alpha=False):
    scene.render.filepath = os.path.join(OUT, name)
    scene.render.image_settings.file_format = fmt
    if fmt == 'PNG':
        scene.render.image_settings.color_mode = 'RGBA' if alpha else 'RGB'
    scene.render.film_transparent = alpha
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name)

# PASS 1 — plate
render('plate.png')
print('PLATE ONLY DONE')
