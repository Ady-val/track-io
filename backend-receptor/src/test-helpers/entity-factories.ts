import { Area } from '../areas/domain/entities/area.entity';
import { Department } from '../departments/domain/entities/department.entity';
import { TorretaColor } from '../torreta-colors/domain/entities/torreta-color.entity';
import { Receptor } from '../receptors/domain/entities/receptor.entity';
import { Torreta } from '../torretas/domain/entities/torreta.entity';
import { Device } from '../devices/domain/entities/device.entity';
import { DeviceSignal } from '../device-signals/domain/entities/device-signal.entity';
import {
  Measurement,
  MeasurementType,
} from '../measurements/domain/entities/measurement.entity';
import { MeasurementValue } from '../measurements/domain/entities/measurement-value.entity';
import { RawSignal } from '../signals/domain/entities/raw-signal.entity';
import { ProcessedSignal } from '../signals/domain/entities/processed-signal.entity';
import { Event, EventStatus } from '../events/domain/entities/event.entity';
import {
  AlertRule,
  AlertRuleMode,
} from '../alert-rules/domain/entities/alert-rule.entity';
import { RawMeasurement } from '../raw-measurements/domain/entities/raw-measurement.entity';
import { DashboardMeasurement } from '../dashboard-measurements/domain/entities/dashboard-measurement.entity';
import { DashboardMeasurementGroup } from '../dashboard-measurements/domain/entities/dashboard-measurement-group.entity';
import { AreaDowntime } from '../area-downtime/domain/entities/area-downtime.entity';
import { AreaDowntimeEvent } from '../area-downtime/domain/entities/area-downtime-event.entity';
import { User } from '../users/domain/entities/user.entity';
import { Session } from '../auth/domain/entities/session.entity';
import { Permission } from '../permissions/domain/entities/permission.entity';
import { Role } from '../permissions/domain/entities/role.entity';
import { AlertEscalationConfig } from '../alert-escalation/domain/entities/alert-escalation-config.entity';
import {
  AlertEscalationMessage,
  AlertLevel,
  MessageType,
} from '../alert-escalation/domain/entities/alert-escalation-message.entity';
import { EventAlertLog } from '../alert-escalation/domain/entities/event-alert-log.entity';
import { Email } from '../emails/domain/entities/email.entity';
import {
  AlertMessage,
  ReceptorType,
} from '../alert-messages/domain/entities/alert-message.entity';
import { AlertTrigger } from '../alert-triggers/domain/entities/alert-trigger.entity';
import { MessageGroup } from '../message-groups/domain/entities/message-group.entity';
import {
  AreaTorretaConfig,
  TorretaConfigurationType,
} from '../area-torreta-config/domain/entities/area-torreta-config.entity';

export const createMockArea = (overrides?: Partial<Area>): Area => {
  const area = new Area();
  area.id = overrides?.id ?? 1;
  area.name = overrides?.name ?? 'Test Area';
  area.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  area.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(area, overrides);
  if (overrides?.deletedAt !== undefined) {
    area.deletedAt = overrides.deletedAt ?? undefined;
  }
  return area;
};

export const createMockDepartment = (
  overrides?: Partial<Department>
): Department => {
  const department = new Department();
  department.id = overrides?.id ?? 1;
  department.name = overrides?.name ?? 'Test Department';
  department.htmlColor = overrides?.htmlColor ?? '#000000';
  department.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  department.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(department, overrides);
  if (overrides?.deletedAt !== undefined) {
    department.deletedAt = overrides.deletedAt ?? undefined;
  }
  return department;
};

export const createMockTorretaColor = (
  overrides?: Partial<TorretaColor>
): TorretaColor => {
  const color = new TorretaColor();
  color.id = overrides?.id ?? 1;
  color.name = overrides?.name ?? 'Test Color';
  color.htmlColor = overrides?.htmlColor ?? '#FF0000';
  color.deviceColorId = overrides?.deviceColorId ?? 'RED';
  color.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  color.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  return Object.assign(color, overrides);
};

export const createMockReceptor = (overrides?: Partial<Receptor>): Receptor => {
  const receptor = new Receptor();
  receptor.id = overrides?.id ?? 1;
  receptor.externalId = overrides?.externalId ?? 'EXT001';
  receptor.name = overrides?.name ?? 'Test Receptor';
  receptor.isActive = overrides?.isActive ?? true;
  receptor.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  receptor.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(receptor, overrides);
  if (overrides?.deletedAt !== undefined) {
    receptor.deletedAt = overrides.deletedAt ?? undefined;
  }
  return receptor;
};

export const createMockTorreta = (overrides?: Partial<Torreta>): Torreta => {
  const torreta = new Torreta();
  torreta.id = overrides?.id ?? 1;
  torreta.name = overrides?.name ?? 'Test Torreta';
  torreta.description = overrides?.description ?? 'Test Description';
  torreta.externalId = overrides?.externalId ?? 'EXT001';
  torreta.isActive = overrides?.isActive ?? true;
  torreta.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  torreta.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(torreta, overrides);
  if (overrides?.deletedAt !== undefined) {
    torreta.deletedAt = overrides.deletedAt ?? undefined;
  }
  return torreta;
};

export const createMockDevice = (overrides?: Partial<Device>): Device => {
  const device = new Device();
  device.id = overrides?.id ?? 1;
  device.name = overrides?.name ?? 'Test Device';
  device.areaId = overrides?.areaId ?? 1;
  device.externalId = overrides?.externalId ?? 'DEV001';
  device.isVirtualDevice = overrides?.isVirtualDevice ?? false;
  device.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  device.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  device.area = overrides?.area ?? createMockArea({ id: device.areaId });
  device.deviceSignals = overrides?.deviceSignals ?? [];
  Object.assign(device, overrides);
  if (overrides?.deletedAt !== undefined) {
    device.deletedAt = overrides.deletedAt ?? undefined;
  }
  return device;
};

export const createMockDeviceSignal = (
  overrides?: Partial<DeviceSignal>
): DeviceSignal => {
  const deviceSignal = new DeviceSignal();
  deviceSignal.id = overrides?.id ?? 1;
  deviceSignal.name = overrides?.name ?? 'Test Device Signal';
  deviceSignal.deviceId = overrides?.deviceId ?? 1;
  deviceSignal.departmentId = overrides?.departmentId ?? 1;
  deviceSignal.externalValueId = overrides?.externalValueId ?? 'VAL001';
  deviceSignal.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  deviceSignal.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  deviceSignal.device =
    overrides?.device ?? createMockDevice({ id: deviceSignal.deviceId });
  deviceSignal.department =
    overrides?.department ??
    createMockDepartment({ id: deviceSignal.departmentId });
  Object.assign(deviceSignal, overrides);
  if (overrides?.deletedAt !== undefined) {
    deviceSignal.deletedAt = overrides.deletedAt ?? undefined;
  }
  return deviceSignal;
};

export const createMockMeasurement = (
  overrides?: Partial<Measurement>
): Measurement => {
  const measurement = new Measurement();
  measurement.id = overrides?.id ?? 1;
  measurement.externalId = overrides?.externalId ?? 'MEAS001';
  measurement.name = overrides?.name ?? 'Test Measurement';
  measurement.type = overrides?.type ?? MeasurementType.TEMPERATURE;
  measurement.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  measurement.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(measurement, overrides);
  if (overrides?.deletedAt !== undefined) {
    measurement.deletedAt = overrides.deletedAt ?? undefined;
  }
  return measurement;
};

export const createMockMeasurementValue = (
  overrides?: Partial<MeasurementValue>
): MeasurementValue => {
  const value = new MeasurementValue();
  value.id = overrides?.id ?? 1;
  value.measurementId = overrides?.measurementId ?? 1;
  value.value = overrides?.value ?? '25.5';
  value.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  value.measurement =
    overrides?.measurement ??
    createMockMeasurement({ id: value.measurementId });
  return Object.assign(value, overrides);
};

export const createMockRawSignal = (
  overrides?: Partial<RawSignal>
): RawSignal => {
  const rawSignal = new RawSignal();
  rawSignal.id = overrides?.id ?? 1;
  rawSignal.externalId = overrides?.externalId ?? 'EXT001';
  rawSignal.value = overrides?.value ?? 'VAL001';
  rawSignal.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  rawSignal.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  return Object.assign(rawSignal, overrides);
};

export const createMockProcessedSignal = (
  overrides?: Partial<ProcessedSignal>
): ProcessedSignal => {
  const processedSignal = new ProcessedSignal();
  processedSignal.id = overrides?.id ?? 1;
  if (overrides?.deviceId) processedSignal.deviceId = overrides.deviceId;
  if (overrides?.deviceName) processedSignal.deviceName = overrides.deviceName;
  if (overrides?.deviceSignalId)
    processedSignal.deviceSignalId = overrides.deviceSignalId;
  if (overrides?.deviceSignalName)
    processedSignal.deviceSignalName = overrides.deviceSignalName;
  processedSignal.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  return Object.assign(processedSignal, overrides);
};

export const createMockEvent = (overrides?: Partial<Event>): Event => {
  const event = new Event();
  event.id = overrides?.id ?? 1;
  event.areaId = overrides?.areaId ?? 1;
  event.areaName = overrides?.areaName ?? 'Test Area';
  event.departmentId = overrides?.departmentId ?? 1;
  event.departmentName = overrides?.departmentName ?? 'Test Department';
  event.deviceId = overrides?.deviceId ?? 1;
  event.deviceName = overrides?.deviceName ?? 'Test Device';
  event.deviceSignalId = overrides?.deviceSignalId ?? 1;
  event.deviceSignalName = overrides?.deviceSignalName ?? 'Test Signal';
  event.status = overrides?.status ?? EventStatus.OPEN;
  event.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  event.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  event.virtualDevice = overrides?.virtualDevice ?? false;
  event.area = overrides?.area ?? createMockArea({ id: event.areaId });
  event.department =
    overrides?.department ?? createMockDepartment({ id: event.departmentId });
  event.device = overrides?.device ?? createMockDevice({ id: event.deviceId });
  event.deviceSignal =
    overrides?.deviceSignal ??
    createMockDeviceSignal({ id: event.deviceSignalId });
  if (overrides?.reason) event.reason = overrides.reason;
  if (overrides?.comment) event.comment = overrides.comment;
  if (overrides?.inProgressAt) event.inProgressAt = overrides.inProgressAt;
  if (overrides?.closedAt) event.closedAt = overrides.closedAt;
  if (overrides?.durationSeconds)
    event.durationSeconds = overrides.durationSeconds;
  return Object.assign(event, overrides);
};

export const createMockAlertRule = (
  overrides?: Partial<AlertRule>
): AlertRule => {
  const alertRule = new AlertRule();
  alertRule.id = overrides?.id ?? 1;
  alertRule.name = overrides?.name ?? 'Test Alert Rule';
  alertRule.measurementId = overrides?.measurementId ?? 1;
  alertRule.mode = overrides?.mode ?? AlertRuleMode.SETPOINT;
  if (overrides?.operator) alertRule.operator = overrides.operator;
  if (overrides?.setpoint) alertRule.setpoint = overrides.setpoint;
  if (overrides?.minValue) alertRule.minValue = overrides.minValue;
  if (overrides?.maxValue) alertRule.maxValue = overrides.maxValue;
  alertRule.isEnabled = overrides?.isEnabled ?? true;
  alertRule.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  alertRule.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  alertRule.measurement =
    overrides?.measurement ??
    createMockMeasurement({ id: alertRule.measurementId });
  Object.assign(alertRule, overrides);
  if (overrides?.deletedAt !== undefined) {
    alertRule.deletedAt = overrides.deletedAt ?? undefined;
  }
  return alertRule;
};

export const createMockRawMeasurement = (
  overrides?: Partial<RawMeasurement>
): RawMeasurement => {
  const rawMeasurement = new RawMeasurement();
  rawMeasurement.id = overrides?.id ?? 1;
  rawMeasurement.externalId = overrides?.externalId ?? 'MEAS001';
  rawMeasurement.value = overrides?.value ?? '25.5';
  rawMeasurement.virtualDevice = overrides?.virtualDevice ?? false;
  if (overrides?.reason) rawMeasurement.reason = overrides.reason;
  if (overrides?.comment) rawMeasurement.comment = overrides.comment;
  rawMeasurement.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  rawMeasurement.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  return Object.assign(rawMeasurement, overrides);
};

export const createMockDashboardMeasurement = (
  overrides?: Partial<DashboardMeasurement>
): DashboardMeasurement => {
  const dashboardMeasurement = new DashboardMeasurement();
  dashboardMeasurement.id = overrides?.id ?? 1;
  dashboardMeasurement.measurementId = overrides?.measurementId ?? 1;
  dashboardMeasurement.minValue = overrides?.minValue ?? 0;
  dashboardMeasurement.maxValue = overrides?.maxValue ?? 100;
  dashboardMeasurement.createdAt =
    overrides?.createdAt ?? new Date('2025-01-01');
  dashboardMeasurement.updatedAt =
    overrides?.updatedAt ?? new Date('2025-01-01');
  dashboardMeasurement.measurement =
    overrides?.measurement ??
    createMockMeasurement({ id: dashboardMeasurement.measurementId });
  if (overrides?.groupId) dashboardMeasurement.groupId = overrides.groupId;
  if (overrides?.group) dashboardMeasurement.group = overrides.group;
  Object.assign(dashboardMeasurement, overrides);
  if (overrides?.deletedAt !== undefined) {
    dashboardMeasurement.deletedAt = overrides.deletedAt ?? undefined;
  }
  return dashboardMeasurement;
};

export const createMockDashboardMeasurementGroup = (
  overrides?: Partial<DashboardMeasurementGroup>
): DashboardMeasurementGroup => {
  const group = new DashboardMeasurementGroup();
  group.id = overrides?.id ?? 1;
  group.name = overrides?.name ?? 'Test Group';
  group.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  group.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  group.dashboardMeasurements = overrides?.dashboardMeasurements ?? [];
  Object.assign(group, overrides);
  if (overrides?.deletedAt !== undefined) {
    group.deletedAt = overrides.deletedAt ?? undefined;
  }
  return group;
};

export const createMockAreaDowntime = (
  overrides?: Partial<AreaDowntime>
): AreaDowntime => {
  const downtime = new AreaDowntime();
  downtime.id = overrides?.id ?? 1;
  downtime.areaId = overrides?.areaId ?? 1;
  downtime.startAt = overrides?.startAt ?? new Date();
  downtime.isActive = overrides?.isActive ?? true;
  downtime.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  downtime.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  downtime.area = overrides?.area ?? createMockArea({ id: downtime.areaId });
  if (overrides?.endsAt) downtime.endsAt = overrides.endsAt;
  if (overrides?.areaDowntimeEvents)
    downtime.areaDowntimeEvents = overrides.areaDowntimeEvents;
  return Object.assign(downtime, overrides);
};

export const createMockAreaDowntimeEvent = (
  overrides?: Partial<AreaDowntimeEvent>
): AreaDowntimeEvent => {
  const downtimeEvent = new AreaDowntimeEvent();
  downtimeEvent.id = overrides?.id ?? 1;
  downtimeEvent.areaDowntimeId = overrides?.areaDowntimeId ?? 1;
  downtimeEvent.eventId = overrides?.eventId ?? 1;
  downtimeEvent.addedAt = overrides?.addedAt ?? new Date();
  downtimeEvent.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  downtimeEvent.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.areaDowntime)
    downtimeEvent.areaDowntime = overrides.areaDowntime;
  if (overrides?.event) downtimeEvent.event = overrides.event;
  return Object.assign(downtimeEvent, overrides);
};

export const createMockUser = (overrides?: Partial<User>): User => {
  const user = new User();
  user.id = overrides?.id ?? 1;
  user.name = overrides?.name ?? 'Test User';
  user.username = overrides?.username ?? 'testuser';
  user.password = overrides?.password ?? 'hashedPassword123';
  user.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  user.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.createdBy !== undefined) user.createdBy = overrides.createdBy;
  user.roles = overrides?.roles ?? [];
  Object.assign(user, overrides);
  if (overrides?.deletedAt !== undefined) {
    user.deletedAt = overrides.deletedAt ?? undefined;
  }
  return user;
};

export const createMockSession = (overrides?: Partial<Session>): Session => {
  const session = new Session();
  session.id = overrides?.id ?? 1;
  session.userId = overrides?.userId ?? 1;
  session.token = overrides?.token ?? 'test-token-123';
  session.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  if (overrides?.ipAddress) session.ipAddress = overrides.ipAddress;
  if (overrides?.userAgent) session.userAgent = overrides.userAgent;
  if (overrides?.user) session.user = overrides.user;
  return Object.assign(session, overrides);
};

export const createMockPermission = (
  overrides?: Partial<Permission>
): Permission => {
  const permission = new Permission();
  permission.id = overrides?.id ?? 1;
  permission.module = overrides?.module ?? 'areas';
  permission.action = overrides?.action ?? 'read';
  permission.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  permission.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.description) permission.description = overrides.description;
  if (overrides?.roles) permission.roles = overrides.roles;
  return Object.assign(permission, overrides);
};

export const createMockRole = (overrides?: Partial<Role>): Role => {
  const role = new Role();
  role.id = overrides?.id ?? 1;
  role.name = overrides?.name ?? 'Test Role';
  role.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  role.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.description) role.description = overrides.description;
  role.permissions = overrides?.permissions ?? [];
  Object.assign(role, overrides);
  if (overrides?.deletedAt !== undefined) {
    role.deletedAt = overrides.deletedAt ?? undefined;
  }
  return role;
};

export const createMockAlertEscalationConfig = (
  overrides?: Partial<AlertEscalationConfig>
): AlertEscalationConfig => {
  const config = new AlertEscalationConfig();
  config.id = overrides?.id ?? 1;
  config.deviceId = overrides?.deviceId ?? 1;
  config.deviceSignalId = overrides?.deviceSignalId ?? 1;
  config.endpointUrl =
    overrides?.endpointUrl ?? 'http://host.docker.internal:1880/events';
  config.warningDelayMinutes = overrides?.warningDelayMinutes ?? 20;
  config.escalation1DelayMinutes = overrides?.escalation1DelayMinutes ?? 40;
  config.escalation2DelayMinutes = overrides?.escalation2DelayMinutes ?? 60;
  config.escalation3DelayMinutes = overrides?.escalation3DelayMinutes ?? 80;
  config.isActive = overrides?.isActive ?? true;
  config.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  config.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.device) config.device = overrides.device;
  if (overrides?.deviceSignal) config.deviceSignal = overrides.deviceSignal;
  Object.assign(config, overrides);
  if (overrides?.deletedAt !== undefined) {
    config.deletedAt = overrides.deletedAt ?? undefined;
  }
  return config;
};

export const createMockAlertEscalationMessage = (
  overrides?: Partial<AlertEscalationMessage>
): AlertEscalationMessage => {
  const message = new AlertEscalationMessage();
  message.id = overrides?.id ?? 1;
  message.escalationConfigId = overrides?.escalationConfigId ?? 1;
  message.level = overrides?.level ?? AlertLevel.WARNING;
  message.messageType = overrides?.messageType ?? MessageType.EMAIL;
  message.targetId = overrides?.targetId ?? 'test@example.com';
  message.message = overrides?.message ?? 'Test message';
  message.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  message.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.color) message.color = overrides.color;
  if (overrides?.escalationConfig)
    message.escalationConfig = overrides.escalationConfig;
  Object.assign(message, overrides);
  if (overrides?.deletedAt !== undefined) {
    message.deletedAt = overrides.deletedAt ?? undefined;
  }
  return message;
};

export const createMockEventAlertLog = (
  overrides?: Partial<EventAlertLog>
): EventAlertLog => {
  const log = new EventAlertLog();
  log.id = overrides?.id ?? 1;
  log.eventId = overrides?.eventId ?? 1;
  log.level = overrides?.level ?? AlertLevel.WARNING;
  log.sentAt = overrides?.sentAt ?? new Date('2025-01-01');
  log.messagesSent = overrides?.messagesSent ?? [];
  log.success = overrides?.success ?? true;
  log.endpointUrl =
    overrides?.endpointUrl ?? 'http://host.docker.internal:1880/events';
  if (overrides?.errorMessage) log.errorMessage = overrides.errorMessage;
  if (overrides?.event) log.event = overrides.event;
  return Object.assign(log, overrides);
};

export const createMockEmail = (overrides?: Partial<Email>): Email => {
  const email = new Email();
  email.id = overrides?.id ?? 1;
  email.name = overrides?.name ?? 'Test Email';
  email.email = overrides?.email ?? 'test@example.com';
  email.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  email.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(email, overrides);
  if (overrides?.deletedAt !== undefined) {
    email.deletedAt = overrides.deletedAt ?? undefined;
  }
  return email;
};

export const createMockAlertMessage = (
  overrides?: Partial<AlertMessage>
): AlertMessage => {
  const message = new AlertMessage();
  message.id = overrides?.id ?? 1;
  message.alertRuleId = overrides?.alertRuleId ?? 1;
  message.receptorType = overrides?.receptorType ?? ReceptorType.CORREO;
  message.messageData = overrides?.messageData ?? {
    correo: {
      emails: ['test@example.com'],
      subject: 'Test Subject',
      message: 'Test Message',
    },
  };
  message.messageGroupId = overrides?.messageGroupId ?? 1;
  message.status = overrides?.status ?? 'pending';
  message.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  message.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  if (overrides?.alertRule) message.alertRule = overrides.alertRule;
  if (overrides?.messageGroup) message.messageGroup = overrides.messageGroup;
  return Object.assign(message, overrides);
};

export const createMockAlertTrigger = (
  overrides?: Partial<AlertTrigger>
): AlertTrigger => {
  const trigger = new AlertTrigger();
  trigger.id = overrides?.id ?? 1;
  trigger.alertRuleId = overrides?.alertRuleId ?? 1;
  trigger.rawMeasurementId = overrides?.rawMeasurementId ?? 1;
  trigger.measurementValue = overrides?.measurementValue ?? 100.5;
  trigger.conditionResult = overrides?.conditionResult ?? 'value > 100';
  trigger.messagesTriggered = overrides?.messagesTriggered ?? [1, 2];
  trigger.triggeredAt = overrides?.triggeredAt ?? new Date('2025-01-01');
  if (overrides?.alertRule) trigger.alertRule = overrides.alertRule;
  if (overrides?.rawMeasurement)
    trigger.rawMeasurement = overrides.rawMeasurement;
  return Object.assign(trigger, overrides);
};

export const createMockMessageGroup = (
  overrides?: Partial<MessageGroup>
): MessageGroup => {
  const group = new MessageGroup();
  group.id = overrides?.id ?? 1;
  group.name = overrides?.name ?? 'Test Group';
  group.color = overrides?.color ?? '#FF0000';
  group.description = overrides?.description ?? 'Test Description';
  group.order = overrides?.order ?? 0;
  group.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  group.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  return Object.assign(group, overrides);
};

export const createMockAreaTorretaConfig = (
  overrides?: Partial<AreaTorretaConfig>
): AreaTorretaConfig => {
  const config = new AreaTorretaConfig();
  config.id = overrides?.id ?? 1;
  config.areaId = overrides?.areaId ?? 1;
  config.torretaExternalId = overrides?.torretaExternalId ?? 'TORRETA001';
  config.configurationType =
    overrides?.configurationType ?? TorretaConfigurationType.AREA;
  config.isActive = overrides?.isActive ?? true;
  config.createdAt = overrides?.createdAt ?? new Date('2025-01-01');
  config.updatedAt = overrides?.updatedAt ?? new Date('2025-01-01');
  Object.assign(config, overrides);
  if (overrides?.deletedAt !== undefined) {
    config.deletedAt = overrides.deletedAt ?? undefined;
  }
  return config;
};
