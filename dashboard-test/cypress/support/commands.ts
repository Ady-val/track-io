/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login del usuario en la aplicación
       * @example cy.login('ADMIN', 'Admin123!')
       */
      login(username?: string, password?: string): Chainable<void>;

      /**
       * Navega a la página de dispositivos
       * @example cy.visitDevicesPage()
       */
      visitDevicesPage(): Chainable<void>;

      /**
       * Espera a que la tabla de dispositivos esté lista
       * @example cy.waitForDevicesTable()
       */
      waitForDevicesTable(): Chainable<void>;

      /**
       * Obtiene el token de autenticación del localStorage
       * @example cy.getAuthToken()
       */
      getAuthToken(): Chainable<string>;

      /**
       * Crea un área
       * @example cy.createArea('Área Test')
       */
      createArea(name: string): Chainable<{ id: number; name: string }>;

      /**
       * Crea un departamento
       * @example cy.createDepartment('Departamento Test')
       */
      createDepartment(
        name: string,
        htmlColor?: string
      ): Chainable<{ id: number; name: string }>;

      /**
       * Crea un receptor
       * @example cy.createReceptor('REC001', 'Receptor Test')
       */
      createReceptor(
        externalId: string,
        name: string
      ): Chainable<{ id: number; externalId: string; name: string }>;

      /**
       * Crea un dispositivo
       * @example cy.createDevice('Device Test', areaId, 'DEV001')
       */
      createDevice(
        name: string,
        areaId: number,
        externalId: string
      ): Chainable<{ id: number; name: string; externalId: string }>;

      /**
       * Crea una torreta
       * @example cy.createTorreta('Torreta Test', 'TOR001')
       */
      createTorreta(
        name: string,
        externalId?: string
      ): Chainable<{ id: number; name: string; externalId?: string }>;

      /**
       * Crea un color de torreta
       * @example cy.createTorretaColor('Rojo', '#FF0000', 'RED')
       */
      createTorretaColor(
        name: string,
        htmlColor: string,
        deviceColorId: string
      ): Chainable<{
        id: number;
        name: string;
        htmlColor: string;
        deviceColorId: string;
      }>;

      /**
       * Crea un email
       * @example cy.createEmail('Test Email', 'test@example.com')
       */
      createEmail(
        name: string,
        email: string
      ): Chainable<{ id: number; name: string; email: string }>;

      /**
       * Setup completo del entorno de testing: crea todos los catálogos y un dispositivo
       * @example cy.setupTestData()
       */
      setupTestData(): Chainable<{
        area: { id: number; name: string };
        department: { id: number; name: string };
        receptor: { id: number; externalId: string; name: string };
        torreta: { id: number; name: string; externalId?: string };
        torretaColor: {
          id: number;
          name: string;
          htmlColor: string;
          deviceColorId: string;
        };
        email: { id: number; name: string; email: string };
        device: { id: number; name: string; externalId: string };
      }>;

      /**
       * Navega a la página de catálogos usando el sidebar
       * @example cy.visitCatalogsPage()
       */
      visitCatalogsPage(): Chainable<void>;
    }
  }
}

/**
 * Realiza login en la aplicación
 * Si no se proporcionan credenciales, usa valores por defecto del entorno
 */
Cypress.Commands.add("login", (username = "ADMIN", password = "Admin123!") => {
  // Limpiar el localStorage antes de hacer login para asegurar un estado limpio
  cy.window().then((win) => {
    win.localStorage.clear();
  });

  // Visitar la página de login
  cy.visit("/login");

  // Esperar a que el formulario esté listo (con timeout generoso)
  cy.get('[data-cy="username-input"]', { timeout: 10000 }).should("be.visible");

  // Llenar formulario de login
  cy.get('[data-cy="username-input"]').clear().type(username);
  cy.get('[data-cy="password-input"]').clear().type(password);

  // Hacer click en el botón de login
  cy.get('[data-cy="login-submit-button"]').click();

  // Esperar a que se complete el login (redirección)
  cy.url({ timeout: 10000 }).should("not.include", "/login");

  // Esperar a que el token esté guardado en localStorage
  cy.window()
    .its("localStorage")
    .invoke("getItem", "auth_token")
    .should("exist", { timeout: 5000 });
});

/**
 * Navega a la página de dispositivos usando el sidebar
 * Requiere que el usuario esté autenticado y ya esté en el dashboard
 */
Cypress.Commands.add("visitDevicesPage", () => {
  // Asegurarse de estar en el dashboard (puede estar en cualquier página del dashboard)
  cy.url({ timeout: 10000 }).should("include", "/dashboard");

  // Esperar a que el sidebar esté completamente cargado
  cy.get('a[href="/dashboard/devices"]', { timeout: 10000 }).should(
    "be.visible"
  );

  // Si ya estamos en la página de dispositivos, no hacer nada
  cy.url().then((url) => {
    if (!url.includes("/dashboard/devices")) {
      // Hacer click en el link de Dispositivos en el sidebar
      cy.get('a[href="/dashboard/devices"]').click();

      // Esperar a que la URL cambie
      cy.url({ timeout: 10000 }).should("include", "/dashboard/devices");
    }
  });

  // Esperar a que la página cargue verificando el título
  cy.contains("Dispositivos y Señales", { timeout: 10000 }).should(
    "be.visible"
  );
});

/**
 * Espera a que la tabla de dispositivos esté completamente cargada
 */
Cypress.Commands.add("waitForDevicesTable", () => {
  // Esperar a que desaparezca el spinner de carga
  cy.contains("Cargando dispositivos...", { timeout: 10000 }).should(
    "not.exist"
  );

  // Verificar que la tabla existe
  cy.get('[data-cy="devices-table"], table').should("exist");
});

/**
 * Obtiene el token de autenticación del localStorage
 */
Cypress.Commands.add("getAuthToken", () => {
  // Esperar a que el token esté disponible
  return cy
    .window()
    .its("localStorage")
    .invoke("getItem", "auth_token")
    .should("exist")
    .then((token) => {
      if (!token) {
        throw new Error(
          "No auth token found in localStorage. Please login first."
        );
      }
      return token as string;
    });
});

/**
 * Crea un área mediante API
 */
Cypress.Commands.add("createArea", (name: string) => {
  return cy.getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/areas`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { name },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 409) {
          // Área ya existe, buscar el existente
          return cy
            .request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/areas?name=${encodeURIComponent(name)}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((getResponse) => {
              const area = getResponse.body.data?.[0];
              if (!area || !area.id) {
                throw new Error(
                  `Área "${name}" debería existir pero no se encontró o no tiene estructura válida`
                );
              }
              return { id: area.id, name: area.name };
            });
        }
        return {
          id: response.body.data?.id,
          name: response.body.data?.name,
        };
      });
  });
});

/**
 * Crea un departamento mediante API
 */
Cypress.Commands.add("createDepartment", (name: string, htmlColor?: string) => {
  return cy.getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/departments`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { name, ...(htmlColor && { htmlColor }) },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 409) {
          // Departamento ya existe, buscar el existente
          return cy
            .request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/departments?name=${encodeURIComponent(name)}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((getResponse) => {
              const dept = getResponse.body.data?.[0];
              if (!dept || !dept.id) {
                throw new Error(
                  `Departamento "${name}" debería existir pero no se encontró o no tiene estructura válida`
                );
              }
              return { id: dept.id, name: dept.name };
            });
        }
        return {
          id: response.body.data?.id,
          name: response.body.data?.name,
        };
      });
  });
});

/**
 * Crea un receptor mediante API
 */
Cypress.Commands.add("createReceptor", (externalId: string, name: string) => {
  return cy.getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/receptors`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { externalId, name, isActive: true },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 409) {
          // Receptor ya existe, buscar el existente
          return cy
            .request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/receptors?externalId=${encodeURIComponent(externalId)}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((getResponse) => {
              const receptor = getResponse.body.data?.[0];
              if (!receptor || !receptor.id) {
                throw new Error(
                  `Receptor "${externalId}" debería existir pero no se encontró o no tiene estructura válida`
                );
              }
              return {
                id: receptor.id,
                externalId: receptor.externalId,
                name: receptor.name,
              };
            });
        }
        return {
          id: response.body.data?.id,
          externalId: response.body.data?.externalId,
          name: response.body.data?.name,
        };
      });
  });
});

/**
 * Crea un dispositivo mediante API
 */
Cypress.Commands.add(
  "createDevice",
  (name: string, areaId: number, externalId: string) => {
    return cy.getAuthToken().then((token) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/devices`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: { name, areaId, externalId },
          failOnStatusCode: false,
        })
        .then((response) => {
          if (response.status === 409) {
            // Dispositivo ya existe, buscar el existente
            return cy
              .request({
                method: "GET",
                url: `${Cypress.env("apiUrl")}/devices?externalId=${encodeURIComponent(externalId)}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((getResponse) => {
                const device = getResponse.body.data?.[0];
                if (!device || !device.id) {
                  throw new Error(
                    `Dispositivo "${externalId}" debería existir pero no se encontró o no tiene estructura válida`
                  );
                }
                return {
                  id: device.id,
                  name: device.name,
                  externalId: device.externalId,
                };
              });
          }
          return {
            id: response.body.data?.id,
            name: response.body.data?.name,
            externalId: response.body.data?.externalId,
          };
        });
    });
  }
);

/**
 * Crea una torreta mediante API
 */
Cypress.Commands.add("createTorreta", (name: string, externalId?: string) => {
  return cy.getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/torretas`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { name, ...(externalId && { externalId }), isActive: true },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 409) {
          // Torreta ya existe, buscar el existente por nombre
          return cy
            .request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/torretas?name=${encodeURIComponent(name)}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((getResponse) => {
              const torreta = getResponse.body.data?.[0];
              if (!torreta || !torreta.id) {
                throw new Error(
                  `Torreta "${name}" debería existir pero no se encontró o no tiene estructura válida`
                );
              }
              return {
                id: torreta.id,
                name: torreta.name,
                externalId: torreta.externalId,
              };
            });
        }
        return {
          id: response.body.data?.id,
          name: response.body.data?.name,
          externalId: response.body.data?.externalId,
        };
      });
  });
});

/**
 * Crea un color de torreta mediante API
 */
Cypress.Commands.add(
  "createTorretaColor",
  (name: string, htmlColor: string, deviceColorId: string) => {
    return cy.getAuthToken().then((token) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/torreta-colors`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: { name, htmlColor, deviceColorId },
          failOnStatusCode: false,
        })
        .then((response) => {
          if (response.status === 409) {
            // Color ya existe, buscar el existente por nombre
            return cy
              .request({
                method: "GET",
                url: `${Cypress.env("apiUrl")}/torreta-colors?name=${encodeURIComponent(name)}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((getResponse) => {
                const color = getResponse.body.data?.[0];
                if (!color || !color.id) {
                  throw new Error(
                    `Color de torreta "${name}" debería existir pero no se encontró o no tiene estructura válida`
                  );
                }
                return {
                  id: color.id,
                  name: color.name,
                  htmlColor: color.htmlColor,
                  deviceColorId: color.deviceColorId,
                };
              });
          }
          return {
            id: response.body.data?.id,
            name: response.body.data?.name,
            htmlColor: response.body.data?.htmlColor,
            deviceColorId: response.body.data?.deviceColorId,
          };
        });
    });
  }
);

/**
 * Crea un email mediante API
 */
Cypress.Commands.add("createEmail", (name: string, email: string) => {
  return cy.getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/emails`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { name, email },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 409) {
          // Email ya existe, buscar el existente por email
          return cy
            .request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/emails?email=${encodeURIComponent(email)}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((getResponse) => {
              const emailData = getResponse.body.data?.[0];
              if (!emailData || !emailData.id) {
                throw new Error(
                  `Email "${email}" debería existir pero no se encontró o no tiene estructura válida`
                );
              }
              return {
                id: emailData.id,
                name: emailData.name,
                email: emailData.email,
              };
            });
        }
        return {
          id: response.body.data?.id,
          name: response.body.data?.name,
          email: response.body.data?.email,
        };
      });
  });
});

/**
 * Setup completo del entorno de testing
 * Crea todos los catálogos (área, departamento, receptor, torreta, torreta color, email) y un dispositivo
 */
Cypress.Commands.add("setupTestData", () => {
  // Crear área
  return cy.createArea("Área de Testing").then((area) => {
    // Crear departamento
    return cy
      .createDepartment("Departamento de Testing", "#3B82F6")
      .then((department) => {
        // Crear receptor
        return cy
          .createReceptor("REC_TEST_001", "Receptor de Testing")
          .then((receptor) => {
            // Crear torreta
            return cy
              .createTorreta("Torreta de Testing", "TOR_TEST_001")
              .then((torreta) => {
                // Crear color de torreta
                return cy
                  .createTorretaColor("Rojo Testing", "#FF0000", "RED_TEST")
                  .then((torretaColor) => {
                    // Crear email
                    return cy
                      .createEmail("Email de Testing", "test@testing.local")
                      .then((email) => {
                        // Crear dispositivo
                        return cy
                          .createDevice(
                            "Dispositivo de Testing",
                            area.id,
                            "DEV_TEST_001"
                          )
                          .then((device) => {
                            return {
                              area,
                              department,
                              receptor,
                              torreta,
                              torretaColor,
                              email,
                              device,
                            };
                          });
                      });
                  });
              });
          });
      });
  });
});

/**
 * Navega a la página de catálogos usando el sidebar
 */
Cypress.Commands.add("visitCatalogsPage", () => {
  // Asegurarse de estar en el dashboard
  cy.url({ timeout: 10000 }).should("include", "/dashboard");

  // Esperar a que el sidebar esté completamente cargado
  cy.get('a[href="/dashboard/catalogs"]', { timeout: 10000 }).should(
    "be.visible"
  );

  // Si ya estamos en la página de catálogos, no hacer nada
  cy.url().then((url) => {
    if (!url.includes("/dashboard/catalogs")) {
      // Hacer click en el link de Catálogos en el sidebar
      cy.get('a[href="/dashboard/catalogs"]').click();

      // Esperar a que la URL cambie
      cy.url({ timeout: 10000 }).should("include", "/dashboard/catalogs");
    }
  });

  // Esperar a que la página cargue verificando el título
  cy.contains("Gestión de Catálogos", { timeout: 10000 }).should("be.visible");
});

export {};
