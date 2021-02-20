/**
 * @fileoverview This file contains incomplete typings for gnome shell types.
 *
 * Probably the best source of definitive API documentation is here:
 * https://gjs-docs.gnome.org/
 *
 * However, there are also some ways the GJS works that make the API docs above
 * slightly incomplete.
 * https://wiki.gnome.org/Projects/GnomeShell/Extensions/StepByStepTutorial
 * mentions that constructors can take a property map as an argument. This file
 * does not correctly type the constructors for these types.
 */

/**
 * Based on https://developer.gnome.org/shell/stable/shell-shell-app.html#ShellApp.
 */
export interface ShellApp {
    get_id(): string;
    get_app_info(): GDesktopAppInfo;
    create_icon_texture(): ClutterActor
    get_name(): string;
    get_description(): string;
    is_window_backed(): boolean;
    activate_window(): void;
    activate(): void;
    activate_full(): void;
    open_new_window(): void;
    can_open_new_window(): boolean;
    get_state(): ShellAppState;
    request_quit(): boolean;
    get_n_windows(): number;
    get_windows(): any[];
    get_pids(): any[];
    is_on_workspace(): boolean;
    launch(): boolean;
    launch_action(): void;
    compare_by_name(): void;
    compare(): void;
    update_window_actions(): void;
    update_app_menu(): void;
    get_busy(): boolean;
}

export interface GDesktopAppInfo {

}

/**
 * Based on https://gjs-docs.gnome.org/clutter4~4_api/clutter.actor.
 */
export interface ClutterActor {
    // Functions not documented anywhere:
    connect(eventName: string, handler: Function): number;
    disconnect(id: number): void;
    emit(name: string, ...args: any): void;

    // Methods from the API documentation page.


    // add_action(action): someType;
    // add_action_with_name(name, action): someType;
    add_child(child: ClutterActor): void;
    // add_constraint(constraint): someType;
    // add_constraint_with_name(name, constraint): someType;
    // add_effect(effect): someType;
    // add_effect_with_name(name, effect): someType;
    // add_transition(name, transition): someType;
    // allocate(box): someType;
    // allocate_align_fill(box, x_align, y_align, x_fill, y_fill): someType;
    // allocate_available_size(x, y, available_width, available_height): someType;
    // allocate_preferred_size(x, y): someType;
    // apply_relative_transform_to_point(ancestor, point): someType;
    // apply_transform_to_point(point): someType;
    // bind_model(model, create_child_func): someType;
    // clear_actions(): someType;
    // clear_constraints(): someType;
    // clear_effects(): someType;
    // contains(descendant): someType;
    // continue_paint(paint_context): someType;
    // continue_pick(pick_context): someType;
    // create_pango_context(): someType;
    // create_pango_layout(text): someType;
    destroy(): void;
    destroy_all_children(): void;
    // event(event, capture): someType;
    // get_abs_allocation_vertices(): someType;
    // get_accessible(): someType;
    // get_action(name): someType;
    // get_actions(): someType;
    // get_allocation_box(): someType;
    // get_background_color(): someType;
    // get_child_at_index(index_): someType;
    // get_child_transform(): someType;
    // get_children(): someType;
    // get_clip(): someType;
    // get_clip_to_allocation(): someType;
    // get_constraint(name): someType;
    // get_constraints(): someType;
    // get_content(): someType;
    // get_content_box(): someType;
    // get_content_gravity(): someType;
    // get_content_repeat(): someType;
    // get_content_scaling_filters(): someType;
    // get_default_paint_volume(): someType;
    // get_easing_delay(): someType;
    // get_easing_duration(): someType;
    // get_easing_mode(): someType;
    // get_effect(name): someType;
    // get_effects(): someType;
    // get_first_child(): someType;
    // get_fixed_position(): someType;
    // get_fixed_position_set(): someType;
    // get_flags(): someType;
    // get_height(): someType;
    // get_last_child(): someType;
    // get_layout_manager(): someType;
    // get_margin(): someType;
    // get_margin_bottom(): someType;
    // get_margin_left(): someType;
    // get_margin_right(): someType;
    // get_margin_top(): someType;
    // get_n_children(): someType;
    // get_name(): someType;
    // get_next_sibling(): someType;
    // get_offscreen_redirect(): someType;
    // get_opacity(): someType;
    // get_opacity_override(): someType;
    // get_paint_box(): someType;
    // get_paint_opacity(): someType;
    // get_paint_visibility(): someType;
    // get_paint_volume(): someType;
    // get_pango_context(): someType;
    // get_parent(): someType;
    // get_pivot_point(): someType;
    // get_pivot_point_z(): someType;
    // get_position(): someType;
    // get_preferred_height(for_width): someType;
    // get_preferred_size(): someType;
    // get_preferred_width(for_height): someType;
    // get_previous_sibling(): someType;
    // get_reactive(): someType;
    // get_request_mode(): someType;
    // get_resource_scale(): someType;
    // get_rotation_angle(axis): someType;
    // get_scale(): someType;
    // get_scale_z(): someType;
    // get_size(): someType;
    // get_stage(): someType;
    // get_text_direction(): someType;
    // get_transform(): someType;
    // get_transformed_extents(): someType;
    // get_transformed_paint_volume(relative_to_ancestor): someType;
    // get_transformed_position(): someType;
    // get_transformed_size(): someType;
    // get_transition(name): someType;
    // get_translation(): someType;
    // get_width(): someType;
    // get_x(): someType;
    // get_x_align(): someType;
    // get_x_expand(): someType;
    // get_y(): someType;
    // get_y_align(): someType;
    // get_y_expand(): someType;
    // get_z_position(): someType;
    // grab_key_focus(): someType;
    // has_accessible(): someType;
    // has_actions(): someType;
    // has_allocation(): someType;
    // has_clip(): someType;
    // has_constraints(): someType;
    // has_damage(): someType;
    // has_effects(): someType;
    // has_key_focus(): someType;
    // has_mapped_clones(): someType;
    // has_overlaps(): someType;
    // has_pointer(): someType;
    // hide(): someType;
    // inhibit_culling(): someType;
    // insert_child_above(child, sibling): someType;
    // insert_child_at_index(child, index_): someType;
    // insert_child_below(child, sibling): someType;
    // invalidate_transform(): someType;
    // is_effectively_on_stage_view(view): someType;
    // is_in_clone_paint(): someType;
    // is_mapped(): someType;
    // is_realized(): someType;
    // is_rotated(): someType;
    // is_scaled(): someType;
    // is_visible(): someType;
    // map(): someType;
    // move_by(dx, dy): someType;
    // needs_expand(orientation): someType;
    // paint(paint_context): someType;
    // peek_stage_views(): someType;
    // pick(pick_context): someType;
    // pick_box(pick_context, box): someType;
    // queue_redraw(): someType;
    // queue_redraw_with_clip(clip): someType;
    // queue_relayout(): someType;
    // realize(): someType;
    // remove_action(action): someType;
    // remove_action_by_name(name): someType;
    // remove_all_children(): someType;
    // remove_all_transitions(): someType;
    // remove_child(child): someType;
    // remove_clip(): someType;
    // remove_constraint(constraint): someType;
    // remove_constraint_by_name(name): someType;
    // remove_effect(effect): someType;
    // remove_effect_by_name(name): someType;
    // remove_transition(name): someType;
    // replace_child(old_child, new_child): someType;
    // restore_easing_state(): someType;
    // save_easing_state(): someType;
    // set_allocation(box): someType;
    // set_background_color(color): someType;
    // set_child_above_sibling(child, sibling): someType;
    // set_child_at_index(child, index_): someType;
    // set_child_below_sibling(child, sibling): someType;
    // set_child_transform(transform): someType;
    // set_clip(xoff, yoff, width, height): someType;
    // set_clip_to_allocation(clip_set): someType;
    // set_content(content): someType;
    // set_content_gravity(gravity): someType;
    // set_content_repeat(repeat): someType;
    // set_content_scaling_filters(min_filter, mag_filter): someType;
    // set_easing_delay(msecs): someType;
    // set_easing_duration(msecs): someType;
    // set_easing_mode(mode): someType;
    // set_fixed_position_set(is_set): someType;
    // set_flags(flags): someType;
    // set_height(height): someType;
    // set_layout_manager(manager): someType;
    // set_margin(margin): someType;
    // set_margin_bottom(margin): someType;
    // set_margin_left(margin): someType;
    // set_margin_right(margin): someType;
    // set_margin_top(margin): someType;
    // set_name(name): someType;
    // set_offscreen_redirect(redirect): someType;
    set_opacity(opacity: number): void;
    // set_opacity_override(opacity): someType;
    // set_pivot_point(pivot_x, pivot_y): someType;
    // set_pivot_point_z(pivot_z): someType;
    set_position(x: number, y: number): void;
    // set_reactive(reactive): someType;
    // set_request_mode(mode): someType;
    // set_rotation_angle(axis, angle): someType;
    // set_scale(scale_x, scale_y): someType;
    // set_scale_z(scale_z): someType;
    // set_size(width, height): someType;
    // set_text_direction(text_dir): someType;
    // set_transform(transform): someType;
    // set_translation(translate_x, translate_y, translate_z): someType;
    // set_width(width): someType;
    // set_x(x): someType;
    // set_x_align(x_align): someType;
    // set_x_expand(expand): someType;
    // set_y(y): someType;
    // set_y_align(y_align): someType;
    // set_y_expand(expand): someType;
    // set_z_position(z_position): someType;
    // should_pick_paint(): someType;
    // show(): someType;
    // transform_stage_point(x, y): someType;
    // uninhibit_culling(): someType;
    // unmap(): someType;
    // unrealize(): someType;
    // unset_flags(flags): someType;

    // Properties:

    // actions:	Clutter.Action; writeonly
    //readonly allocation:	Clutter.ActorBox;
    // background_color:	Clutter.Color;
    readonly background_color_set: boolean;
    readonly child_transform_set: boolean;
    //clip_rect	Graphene.Rect;
    //clip_to_allocation	boolean;
    // constraints	Clutter.Constraint	w
    // content	Clutter.Content;
    //readonly content_box:	Clutter.ActorBox;
    //content_gravity:	Clutter.ContentGravity;
    //content_repeat:	Clutter.ContentRepeat;
    //effect	Clutter.Effect	w
    // readonly first_child: Clutter.Actor;
    fixed_position_set:	boolean;
    fixed_x:	number;
    fixed_y:	number;
    readonly has_clip: boolean;
    readonly has_pointer: boolean;
    height: number;
    // readonly last_child: Clutter.Actor;
    layout_manager:	LayoutManager;
    // magnification_filter:	Clutter.ScalingFilter;
    readonly mapped:	boolean;
    margin_bottom:	number;
    margin_left:	number;
    margin_right:	number;
    margin_top:	number;
    min_height:	number;
    min_height_set:	boolean;
    min_width:	number;
    min_width_set:	boolean;
    //minification_filter:	Clutter.ScalingFilter;
    name:	String;
    natural_height:	number;
    natural_height_set:	boolean;
    natural_width:	number;
    natural_width_set:	boolean;
    //offscreen_redirect:	Clutter.OffscreenRedirect;
    opacity:	number;
    //pivot_point:	Graphene.Point;
    pivot_point_z:	number;
    //position:	Graphene.Point;
    reactive:	boolean;
    readonly realized:	boolean;
    //request_mode:	Clutter.RequestMode;
    rotation_angle_x:	number;
    rotation_angle_y:	number;
    rotation_angle_z:	number;
    scale_x:	number;
    scale_y:	number;
    scale_z:	number;
    show_on_set_parent:	boolean;
    //size:	Graphene.Size;
    // text_direction:	Clutter.TextDirection;
    readonly transform_set:	boolean;
    translation_x:	number;
    translation_y:	number;
    translation_z:	number;
    visible:	boolean;
    width:	number;
    x:	number;
    //x_align:	Clutter.ActorAlign;
    x_expand:	boolean;
    y:	number;
    //y_align:	Clutter.ActorAlign;
    y_expand:	boolean;
    z_position:	number;
}

interface ClutterContainer {
    /**
     * 
     * @see https://gjs-docs.gnome.org/clutter7~7_api/clutter.container#method-add_actor
     * @deprecated
     */
    add_actor(actor: ClutterActor): void;
    // child_get_property(child, property, value): someType;
    // child_notify(child, pspec): someType;
    // child_set_property(child, property, value): someType;
    // create_child_meta(actor): someType;
    // destroy_child_meta(actor): someType;
    // find_child_by_name(child_name): someType;
    // get_child_meta(actor): someType;
    // get_children(): someType;
    // lower_child(actor, sibling): someType;
    // raise_child(actor, sibling): someType;
    // remove_actor(actor): someType;
    // sort_depth_order(): someType;
}

interface ShellAppState { }

/**
 *
 * See https://developer.gnome.org/shell/stable/shell-shell-window-tracker.html#shell-window-tracker-get-startup-sequences.
 */
export interface ShellWindowTracker {
    get_window_app(metaWindow: MetaWindow): ShellApp;
    get_app_from_pid(pid: number): ShellApp;

    focus_app: ShellApp | null;
}

export interface MetaWindow {
    get_title(): string;
    get_monitor(): number;
}

/**
 * Based on https://gjs-docs.gnome.org/meta4~4_api/meta.workspacemanager.
 */
export interface WorkspaceManager {
    get_active_workspace(): Workspace;
}

/**
 * Based on 
 */
export interface Workspace {
    //activate(timestamp)
    //activate_with_focus(focus_this, timestamp)
    get_display(): Display;
    //get_neighbor(direction)
    get_work_area_all_monitors(): Rectangle;
    get_work_area_for_monitor(whichMonitor: number): Rectangle;
    index(): number;
    list_windows(): Window[];
    set_builtin_struts(struts: Strut[]): void;
}

export interface Display {
}

export interface Rectangle {
    /** X coordinate of the top-left corner. */
    x: number;
    /** Y coordinate of the top-left corner. */
    y: number;
    /** Width of the rectangle. */
    width: number;
    /** Height of the rectangle. */
    height: number;
}

export interface Strut {
}

export interface Window {
    activate(current_time: number): void;
    activate_with_workspace(current_time: number, workspace: Workspace): void;
    allows_move(): boolean;
    allows_resize(): boolean;
    //begin_grab_op(op: GrabOp, frame_action: boolean, timestamp: number): void;
    can_close(): boolean;
    can_maximize(): boolean;
    can_minimize(): boolean;
    can_shade(): boolean;
    change_workspace(workspace: Workspace): void;
    change_workspace_by_index(space_index: number, append: boolean): void;
    check_alive(timestamp: number): void;
    client_rect_to_frame_rect(client_rect: Rectangle): void;
    compute_group(): void;
    delete(timestamp: number): void;
    find_root_ancestor(): void;
    focus(timestamp: number): void;
    //foreach_ancestor(func): void;
    //foreach_transient(func): void;
    frame_rect_to_client_rect(frame_rect: Rectangle): Rectangle;
    get_buffer_rect(): Rectangle;
    get_client_machine(): string;
    // get_client_type(): WindowClientType;
    //get_compositor_private(): void;
    get_description(): string;
    get_display(): Display;
    //get_frame_bounds(): void;
    get_frame_rect(): Rectangle;
    get_frame_type(): FrameType;
    get_gtk_app_menu_object_path(): string;
    get_gtk_application_id(): string;
    get_gtk_application_object_path(): string;
    get_gtk_menubar_object_path(): string;
    get_gtk_theme_variant(): string;
    get_gtk_unique_bus_name(): string;
    get_gtk_window_object_path(): string;
    // get_icon_geometry(): [boolean, Rectangle];
    get_id(): number;
    get_layer(): StackLayer;
    get_maximized(): boolean;

    /**
     * Return the index of the monitor in the screens monitor list, or -1 if the
     * window has been recently unmanaged and does not have a monitor.
     */
    get_monitor(): number;
    get_mutter_hints(): string | null;
    get_pid(): number;
    get_role(): string;
    get_sandboxed_app_id(): string;
    get_stable_sequence(): number;
    get_startup_id(): string;
    get_tile_match(): Window | null;
    get_title(): string;
    get_transient_for(): Window | null;
    get_user_time(): number;
    get_window_type(): WindowType;
    get_wm_class(): void;
    get_wm_class_instance(): void;
    get_work_area_all_monitors(): Rectangle;
    get_work_area_current_monitor(): Rectangle;
    get_work_area_for_monitor(which_monitor: number): Rectangle;
    get_workspace(): void;
    group_leader_changed(): void;
    has_focus(): boolean;
    is_above(): void;
    is_always_on_all_workspaces(): void;
    is_ancestor_of_transient(transient: Window): void;
    is_attached_dialog(): void;
    is_client_decorated(): void;
    is_fullscreen(): void;
    is_hidden(): void;
    is_monitor_sized(): void;
    is_on_all_workspaces(): void;
    is_on_primary_monitor(): void;
    is_override_redirect(): void;
    is_remote(): void;
    is_screen_sized(): void;
    is_shaded(): void;
    is_skip_taskbar(): void;
    kill(): void;
    located_on_workspace(workspace: Workspace): void;
    lower(): void;
    make_above(): void;
    make_fullscreen(): void;
    //maximize(directions): void;
    minimize(): void;
    //move_frame(user_op, root_x_nw, root_y_nw): void;
    /**
     * Resizes the window so that its outer bounds (including frame) fit within
     * the given rect.
     *
     * @param user_op indicates whether or not this is a user operation
     * @param root_x_nw new x
     * @param root_y_nw new y
     * @param w new width
     * @param h new height
     */
    move_resize_frame(user_op: boolean, root_x_nw: number, root_y_nw: number, w: number, h: number): void;
    move_to_monitor(monitor: number): void;
    raise(): void;
    requested_bypass_compositor(): void;
    requested_dont_bypass_compositor(): void;
    //set_compositor_private(priv): void;
    set_demands_attention(): void;
    set_icon_geometry(rect): void;
    //shade(timestamp): void;
    shove_titlebar_onscreen(): void;
    showing_on_its_workspace(): void;
    shutdown_group(): void;
    stick(): void;
    titlebar_is_onscreen(): void;
    unmake_above(): void;
    unmake_fullscreen(): void;
    unmaximize(directions: MaximizeFlags): void;
    unminimize(): void;
    unset_demands_attention(): void;
    //unshade(timestamp): void;
    unstick(): void;

    readonly above: boolean;
    readonly appears_focused: boolean;
    readonly decorated: boolean;
    readonly demands_attention: boolean;
    readonly fullscreen: boolean;
    readonly gtk_app_menu_object_path: string;
    readonly gtk_application_id: string;
    readonly gtk_application_object_path: string;
    readonly gtk_menubar_object_path: string;
    readonly gtk_unique_bus_name: string;
    readonly gtk_window_object_path: string;
    // icon	void	r
    readonly maximized_horizontally: boolean;
    readonly maximized_vertically: boolean;
    // mini_icon	void	r
    readonly minimized: boolean;
    readonly mutter_hints: string;
    readonly on_all_workspaces: boolean;
    readonly resizeable: boolean;
    readonly skip_taskbar: boolean;
    readonly title: string;
    readonly urgent: boolean;
    readonly user_time: number;
    readonly window_type: WindowType;
    readonly wm_class: string;
}

export interface StackLayer {}

/**
 * From https://gjs-docs.gnome.org/meta4~4_api/meta.frametype.
 */
export enum FrameType {
    NORMAL = 0, // Normal frame
    DIALOG = 1, // Dialog frame
    MODAL_DIALOG = 2, // Modal dialog frame
    UTILITY = 3, // Utility frame
    MENU = 4, // Menu frame
    BORDER = 5, // Border frame
    ATTACHED = 6, // Attached frame
    LAST = 7, // Marks the end of the Meta.FrameType enumeration
}

export enum WindowType {
    NORMAL = 0, // Normal
    DESKTOP = 1, // Desktop
    DOCK = 2, // Dock
    DIALOG = 3, // Dialog
    MODAL_DIALOG = 4, // Modal dialog
    TOOLBAR = 5, // Toolbar
    MENU = 6, // Menu
    UTILITY = 7, // Utility
    SPLASHSCREEN = 8, // Splashcreen
    DROPDOWN_MENU = 9, // Dropdown menu
    POPUP_MENU = 10, // Popup menu
    TOOLTIP = 11, // Tooltip
    NOTIFICATION = 12, // Notification
    COMBO = 13, // Combobox
    DND = 14, // Drag and drop
    OVERRIDE_OTHER = 15, // Other override-redirect window type
}

export enum MaximizeFlags {
    HORIZONTAL = 1, // Horizontal
    VERTICAL = 2, // Vertical
    BOTH = 3, // Both
}

/**
 *
 * Based on https://developer.gnome.org/st/stable/st-st-box-layout.html.
 */
export interface BoxLayout extends StWidget, ClutterActor {

}

/**
 * @see https://gjs-docs.gnome.org/st10~1.0_api/st.bin
 */
export interface StBin extends ClutterContainer, ClutterActor, StWidget {
}


/**
 * @see https://gjs-docs.gnome.org/st10~1.0_api/st.button
 */
export interface StButton extends ClutterContainer, ClutterActor, StWidget, StBin {
}

/**
 * 
 */
export interface StWidget extends ClutterActor {
    // add_accessible_state(state): someTYpe;
    // add_style_class_name(style_class): someTYpe;
    add_style_pseudo_class(pseudo_class: string): void;
    // ensure_style(): someTYpe;
    // get_accessible_name(): someTYpe;
    // get_accessible_role(): someTYpe;
    // get_can_focus(): someTYpe;
    // get_focus_chain(): someTYpe;
    // get_hover(): someTYpe;
    // get_label_actor(): someTYpe;
    // get_style(): someTYpe;
    // get_style_class_name(): someTYpe;
    // get_style_pseudo_class(): someTYpe;
    // get_theme_node(): someTYpe;
    // get_track_hover(): someTYpe;
    // has_style_class_name(style_class): someTYpe;
    // has_style_pseudo_class(pseudo_class): someTYpe;
    // navigate_focus(from, direction, wrap_around): someTYpe;
    // paint_background(paint_context): someTYpe;
    // peek_theme_node(): someTYpe;
    // popup_menu(): someTYpe;
    // remove_accessible_state(state): someTYpe;
    // remove_style_class_name(style_class): someTYpe;
    remove_style_pseudo_class(pseudo_class: string): void;
    // set_accessible(accessible): someTYpe;
    // set_accessible_name(name): someTYpe;
    // set_accessible_role(role): someTYpe;
    // set_can_focus(can_focus): someTYpe;
    // set_hover(hover): someTYpe;
    // set_label_actor(label): someTYpe;
    // set_style(style): someTYpe;
    // set_style_class_name(style_class_list): someTYpe;
    // set_style_pseudo_class(pseudo_class_list): someTYpe;
    // set_track_hover(track_hover): someTYpe;
    // style_changed(): someTYpe;
    // sync_hover(): someTYpe;

    accessible_name: string;
    //accessible_role: Role Atk;
    can_focus: boolean;
    hover: boolean;
    label_actor: ClutterActor;
    pseudo_class: string;
    style: string;
    style_class: string;
    track_hover: boolean;
    layout_manager: LayoutManager;
}

export interface LayoutManager {}

export interface GridLayout extends LayoutManager {
    /**
     * Adds a widget to the grid. The position of child is determined by left
     * and top. The number of 'cells' that child will occupy is determined by
     * width and height.
     */
    attach(child: ClutterActor, left: number, top: number, width: number, height: number): void;

    // attach_next_to(child, sibling, side, width, height)
    // get_child_at(left, top)
    // get_column_homogeneous()
    // get_column_spacing()
    // get_orientation()
    // get_row_homogeneous()
    // get_row_spacing()
    // insert_column(position)
    // insert_next_to(sibling, side)
    // insert_row(position)
    set_column_homogeneous(homogeneous: boolean): void;
    // set_column_spacing(spacing)
    // set_orientation(orientation)
    set_row_homogeneous(homogeneous: boolean): void;
    // set_row_spacing(spacing)
}

export interface SignalMethods {
    connect(name: string, callback: Function): number;
    disconnect(id: number): void;
    emit(name: string, ...args: any): void;
}
