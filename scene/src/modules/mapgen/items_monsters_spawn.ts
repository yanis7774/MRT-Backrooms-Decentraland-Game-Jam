export enum monsters_enum {
    ink,
    worm,
    mimic
}
export const monster_spawns = [
    [],
    [monsters_enum.ink],
    [monsters_enum.ink],
    [monsters_enum.mimic, monsters_enum.mimic],
    [monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic],
    [monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic],
    [monsters_enum.worm],
    [monsters_enum.ink, monsters_enum.worm],
    [monsters_enum.ink, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.worm],
    [monsters_enum.worm, monsters_enum.worm],
    [monsters_enum.worm, monsters_enum.worm, monsters_enum.ink, monsters_enum.ink, monsters_enum.ink, monsters_enum.mimic, monsters_enum.mimic, monsters_enum.mimic],
    [monsters_enum.worm, monsters_enum.worm, monsters_enum.worm],
]
export const item_drop_rate = 0.4;
export const minimum_spot_rate = 3;
export const max_spot_rate = 7; // max ink spots on level
export const ink_spot_rate_modify = 0.5; // adds to minimum per level
