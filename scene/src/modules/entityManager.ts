import { Animator, ColliderLayer, GltfContainer, Material, MaterialTransparencyMode, MeshRenderer, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

export function createEntity(position: Vector3 = Vector3.create(0,0,0), model: string = "", animation: string = "", noCollision: boolean = false) {
    const entity = engine.addEntity();
    Transform.create(entity, {position:position,scale:Vector3.create(1,1,1)});
    if (!noCollision)
        GltfContainer.create(entity, {src: model});
    else
        GltfContainer.create(entity, {src: model, invisibleMeshesCollisionMask: ColliderLayer.CL_NONE, visibleMeshesCollisionMask: ColliderLayer.CL_POINTER});
    if (animation != "") {
        Animator.create(entity, {
            states: [
                {
                    name: animation,
                    clip: animation,
                    playing: true,
                    loop: true
                }
            ]
        })
    }
    return entity;
}

export function createPlaneShapeEntity(position: Vector3 = Vector3.create(0,0,0), sprite: string = "", scale: Vector3 = Vector3.create(1,1,1), rotation: Quaternion.Mutable = Quaternion.create(0,0,0,0)) {
    const entity = engine.addEntity();
    Transform.create(entity,{position: position, scale: scale, rotation: rotation});
    MeshRenderer.setPlane(entity);
    Material.setPbrMaterial(entity,{
        texture: Material.Texture.Common({src: sprite}),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
    })
    return entity;
}

// export function createCube(position: Vector3 = Vector3.create(0,0,0), scale: Vector3 = Vector3.create(1,1,1)) {
//     const entity = engine.addEntity();
//     Transform.create(entity,{position: position, scale: scale});
//     MeshRenderer.setBox(entity);
//     return entity;
// }