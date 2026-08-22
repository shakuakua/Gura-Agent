import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "smoller_gura_-_gawr_gura_holomyth.glb"
OUT = ROOT / "public" / "smoller_gura_blender_actions.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC))

scene = bpy.context.scene
scene.render.fps = 30

arm_obj = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
arm_obj.animation_data_clear()
if arm_obj.animation_data is None:
    arm_obj.animation_data_create()


def create_action(name, keyframes):
    action = bpy.data.actions.new(name)
    arm_obj.animation_data.action = action
    for frame, transforms in keyframes:
        scene.frame_set(frame)
        for bone_name, euler in transforms.items():
            pose_bone = arm_obj.pose.bones[bone_name]
            pose_bone.rotation_mode = "XYZ"
            pose_bone.rotation_euler = euler
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    return action


def ease_envelope(t, total, fade=0.5):
    if t < fade:
        return t / fade
    if t > total - fade:
        return max(0.0, (total - t) / fade)
    return 1.0


def idle_keyframes():
    out = []
    for frame in range(0, 61, 2):
        t = frame / 30.0
        out.append(
            (
                frame,
                {
                    "spine_01": (math.sin(t * math.pi) * 0.03, 0, math.sin(t * math.pi) * 0.012),
                    "spine.006_07": (math.sin(t * math.pi) * 0.04, 0, math.sin(t * math.pi) * 0.04),
                    "tailroot_032": (math.sin(t * math.pi * 2) * 0.25, 0, 0),
                    "shoulder.R_020": (0, 0, math.sin(t * math.pi) * 0.05),
                    "shoulder.L_016": (0, 0, -math.sin(t * math.pi) * 0.05),
                },
            )
        )
    return out


def wave_keyframes():
    out = []
    for frame in range(0, 121, 2):
        t = frame / 30.0
        env = ease_envelope(t, 4.0)
        sway = math.sin(t * 5.5) * 0.45 * env
        out.append(
            (
                frame,
                {
                    "shoulder.R_020": (0, 0, 0.3 * env),
                    "upper_arm.R_021": (-1.5 * env + sway * 0.5, 0, 0.3 * env),
                    "forearm.R_022": (-0.6 * env, 0, 0),
                    "hand.R_023": (sway * 0.4, 0, 0),
                    "spine_01": (0, 0, math.sin(t * 5.5) * 0.05 * env),
                },
            )
        )
    return out


def nod_keyframes():
    out = []
    for frame in range(0, 91, 2):
        t = frame / 30.0
        env = ease_envelope(t, 3.0, 0.45)
        nod = math.sin(t * 2.6) * 0.38 * env
        out.append(
            (
                frame,
                {
                    "spine.006_07": (nod, 0, 0),
                    "spine_01": (math.sin(t * 2.6) * 0.06 * env, 0, 0),
                },
            )
        )
    return out


def dance_keyframes():
    out = []
    for frame in range(0, 121, 2):
        t = frame / 30.0
        env = ease_envelope(t, 4.0)
        out.append(
            (
                frame,
                {
                    "spine_01": (
                        abs(math.sin(t * 2.1)) * 0.08 * env,
                        0,
                        math.sin(t * 2.5) * 0.12 * env,
                    ),
                    "spine.006_07": (
                        math.sin(t * 2.1) * 0.12 * env,
                        math.sin(t * 1.8) * 0.06 * env,
                        math.sin(t * 2.4) * 0.1 * env,
                    ),
                    "upper_arm.R_021": (
                        -1.4 * env + math.sin(t * 3.4) * 0.25 * env,
                        0,
                        0.3 * env,
                    ),
                    "upper_arm.L_017": (
                        -1.4 * env + math.sin(t * 3.4) * 0.25 * env,
                        0,
                        -0.3 * env,
                    ),
                    "shoulder.R_020": (0, 0, 0.2 * env),
                    "shoulder.L_016": (0, 0, -0.2 * env),
                    "forearm.R_022": (-0.6 * env, 0, 0),
                    "forearm.L_018": (-0.6 * env, 0, 0),
                    "tailroot_032": (math.sin(t * 3.2) * 0.4 * env, 0, 0),
                },
            )
        )
    return out


action_names = ["Gura_Idle", "Gura_Wave", "Gura_Nod", "Gura_Dance"]
for name in action_names:
    if name == "Gura_Idle":
        create_action(name, idle_keyframes())
    elif name == "Gura_Wave":
        create_action(name, wave_keyframes())
    elif name == "Gura_Nod":
        create_action(name, nod_keyframes())
    else:
        create_action(name, dance_keyframes())

arm_obj.animation_data.action = None
for name in action_names:
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, start=0, action=bpy.data.actions[name])

scene.frame_start = 0
scene.frame_end = 121

bpy.ops.export_scene.gltf(
    filepath=str(OUT),
    export_format="GLB",
    use_selection=False,
    export_yup=False,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_anim_single_armature=True,
    export_reset_pose_bones=True,
    export_skins=True,
    export_apply=False,
)

print("EXPORTED", OUT)

