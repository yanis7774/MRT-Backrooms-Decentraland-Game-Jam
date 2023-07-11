import { InputAction, PointerEventType, PointerEventsResult, engine, inputSystem } from "@dcl/sdk/ecs";
import { useItem } from "./objects/inventory";
import { inventoryItems } from "./globals";

export function backpackSystem() {
    const useHealthKid = inputSystem.getInputCommand(
        InputAction.IA_ACTION_3,
        PointerEventType.PET_DOWN
      )
      if (useHealthKid) {
        useItem(inventoryItems.HEALTH_KIT)
    }
    
    const useGasMask = inputSystem.getInputCommand(
        InputAction.IA_ACTION_4,
        PointerEventType.PET_DOWN
      )
      if (useGasMask) {
        useItem(inventoryItems.GAS_MASK)
    }

    const useCandle = inputSystem.getInputCommand(
        InputAction.IA_ACTION_5,
        PointerEventType.PET_DOWN
      )
      if (useCandle) {
        useItem(inventoryItems.WALL_TRAP)
    }
}