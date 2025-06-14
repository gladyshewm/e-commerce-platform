export enum UserCommands {
  Create = 'user.create',
  ActivateEmail = 'user.activate-email',
  SendEmailActivationLink = 'user.send-email-activation-link',
  GetById = 'user.get-by-id',
  GetByName = 'user.get-by-name',
  GetByEmail = 'user.get-by-email',
  UpdateRole = 'user.update-role',
  GetByOAuth = 'user.get-by-oauth',
  LinkWithOAuth = 'user.link-with-oauth',
  CreateOAuth = 'user.create-oauth',
}
