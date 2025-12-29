/// <reference types="cypress" />

describe("DevicesPage - Tests E2E", () => {
  before(() => {
    cy.login();
    cy.setupTestData();
  });

  beforeEach(() => {
    // Asegurar que estamos en una sesión limpia
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();
    cy.visitDevicesPage();
    // Esperar a que la tabla esté cargada
    cy.get('[data-cy="devices-table"]', { timeout: 20000 }).should("exist");
    cy.get(".animate-spin", { timeout: 20000 }).should("not.exist");
    cy.get('[data-cy="devices-table"]').within(() => {
      cy.get("tbody tr", { timeout: 20000 }).should("have.length.at.least", 1);
    });
  });

  describe("Renderizado Básico", () => {
    it("Muestra el título y la tabla de dispositivos", () => {
      cy.contains("Dispositivos y Señales").should("be.visible");
      cy.get('[data-cy="devices-table"]').should("be.visible");
      cy.get('[data-cy="add-device-button"]').should("exist");
    });
  });

  describe("Creación de Dispositivo", () => {
    it("Crea un nuevo dispositivo con señales", () => {
      const deviceName = `Dispositivo Test ${Date.now()}`;
      const externalId = `DEV${Date.now()}`;
      const signalName = `Señal Test ${Date.now()}`;
      const externalValueId = `${Date.now()}`;

      cy.get('[data-cy="add-device-button"]').click();
      cy.get('[data-cy="create-device-modal"]').should("be.visible");

      // Llenar formulario del dispositivo
      cy.get('input[id="device-name"]').clear().type(deviceName);
      cy.get('input[id="device-external-id"]').clear().type(externalId);
      cy.get('select[id="device-area"]').select(1);

      // Llenar formulario de la señal
      cy.get('input[id="signal-name-0"]').clear().type(signalName);
      cy.get('input[id="signal-external-value-0"]').clear().type(externalValueId);
      cy.get('select[id="signal-department-0"]').select(1);

      // Enviar formulario
      cy.get('[data-cy="create-device-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Verificar que el dispositivo aparece
      cy.get('[data-cy="create-device-modal"]', { timeout: 20000 }).should("not.exist");
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.contains(deviceName, { timeout: 10000 }).should("be.visible");
      });
    });
  });

  describe("Edición de Dispositivo", () => {
    it("Edita un dispositivo existente", () => {
      const newName = `Dispositivo Editado ${Date.now()}`;

      // Abrir modal de edición
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="edit-device-button"]').first().click();
      });

      cy.get('[data-cy="edit-device-modal"]', { timeout: 5000 }).should("be.visible");

      // Obtener nombre original y cambiarlo
      cy.get('input[id="edit-device-name"]').then(($input) => {
        const originalName = $input.val() as string;

        cy.get('input[id="edit-device-name"]').clear().type(newName);

        // Guardar cambios
        cy.get('[data-cy="edit-device-modal"]').within(() => {
          cy.get('button[type="submit"]').click();
        });

        // Verificar que el nombre cambió
        cy.get('[data-cy="edit-device-modal"]', { timeout: 20000 }).should("not.exist");
        cy.get('[data-cy="devices-table"]').within(() => {
          cy.contains(newName, { timeout: 10000 }).should("be.visible");
          cy.contains(originalName).should("not.exist");
        });
      });
    });
  });

  describe("Eliminación de Dispositivo", () => {
    it("Elimina un dispositivo existente", () => {
      // Obtener nombre del dispositivo
      let nameToDelete: string;
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get("tbody tr")
          .first()
          .find("td")
          .eq(0)
          .invoke("text")
          .then((text) => {
            nameToDelete = text.trim();
          });
      });

      // Eliminar dispositivo
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="delete-device-button"]').first().click();
      });

      cy.get('[data-cy="delete-device-modal"]', { timeout: 5000 }).should("be.visible");
      cy.get('[data-cy="delete-device-confirm-button"]').click();

      // Verificar que desapareció
      cy.get('[data-cy="delete-device-modal"]', { timeout: 20000 }).should("not.exist");
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.contains(nameToDelete).should("not.exist");
      });
    });
  });

  describe("Gestión de Señales", () => {
    it("Expande una fila para ver las señales", () => {
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="expand-row-button"]').first().click();
      });

      // Verificar que se muestra contenido de señales
      cy.get("body").then(($body) => {
        const text = $body.text();
        expect(
          text.includes("Señales del Dispositivo") ||
            text.includes("No hay señales asociadas")
        ).to.be.true;
      });
    });

    it("Crea una nueva señal para un dispositivo", () => {
      const signalName = `Señal Nueva ${Date.now()}`;
      const externalValueId = `${Date.now()}`;

      // Abrir modal de agregar señal
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="add-signal-button"]').first().click();
      });

      cy.get('[data-cy="add-signal-modal"]', { timeout: 5000 }).should("be.visible");

      // Llenar formulario
      cy.get('input[id="signal-name"]').clear().type(signalName);
      cy.get('input[id="signal-external-value"]').clear().type(externalValueId);
      cy.get('select[id="signal-department"]').select(1);

      // Enviar formulario
      cy.get('[data-cy="add-signal-modal"]').within(() => {
        cy.get('button[type="submit"]').click();
      });

      // Verificar que la señal aparece
      cy.get('[data-cy="add-signal-modal"]', { timeout: 20000 }).should("not.exist");
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="expand-row-button"]').first().click();
      });
      cy.contains(signalName, { timeout: 10000 }).should("be.visible");
    });

    it("Edita una señal existente", () => {
      const newSignalName = `Señal Editada ${Date.now()}`;

      // Expandir fila para ver señales
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="expand-row-button"]').first().click();
      });

      // Esperar a que aparezcan las señales
      cy.contains("Señales del Dispositivo", { timeout: 5000 }).should("be.visible");
      cy.wait(1000);

      // Verificar que hay botones de editar y obtener nombre original
      cy.get('[data-cy="edit-signal-button"]', { timeout: 5000 })
        .should("exist")
        .should("have.length.at.least", 1)
        .then(() => {
          // Obtener nombre original
          cy.get('[data-cy="devices-table"]')
            .contains("Señales del Dispositivo")
            .parent()
            .parent()
            .find("tbody tr")
            .first()
            .find("td")
            .first()
            .invoke("text")
            .then((originalName) => {
              const originalNameTrimmed = originalName.trim();

              // Hacer click en el botón de editar señal
              // HeroUI Button puede requerir click en el elemento interno
              cy.get('[data-cy="edit-signal-button"]')
                .first()
                .scrollIntoView()
                .should("be.visible")
                .then(($btn) => {
                  // Intentar click en el botón o su contenedor clickeable
                  const clickableElement = $btn.find("button, [role='button']").length > 0
                    ? $btn.find("button, [role='button']").first()
                    : $btn;
                  
                  cy.wrap(clickableElement).click({ force: true });
                });

              // Verificar que el modal se abre
              cy.get('[data-cy="edit-signal-modal"]', { timeout: 10000 }).should(
                "be.visible"
              );

              // Editar nombre
              cy.get('input[id="edit-signal-name"]')
                .should("be.visible")
                .clear()
                .type(newSignalName);

              // Guardar
              cy.get('[data-cy="edit-signal-modal"]').within(() => {
                cy.get('button[type="submit"]').click();
              });

              // Esperar cierre del modal y recarga
              cy.get('[data-cy="edit-signal-modal"]', { timeout: 20000 }).should(
                "not.exist"
              );
              
              // Esperar a que termine la recarga
              cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");
              cy.wait(2000); // Dar tiempo para que se complete la recarga

              // Colapsar la fila primero para forzar actualización
              cy.get('[data-cy="devices-table"]').within(() => {
                cy.get('[data-cy="expand-row-button"]').first().click();
                cy.wait(500);
              });

              // Expandir fila nuevamente para verificar los cambios
              cy.get('[data-cy="devices-table"]').within(() => {
                cy.get('[data-cy="expand-row-button"]').first().click();
                cy.wait(1000);
              });

              // Verificar cambio - buscar dentro de la tabla de señales
              cy.contains("Señales del Dispositivo", { timeout: 5000 }).should(
                "be.visible"
              );
              
              // Buscar el nuevo nombre dentro de la tabla de señales
              cy.get('[data-cy="devices-table"]')
                .contains("Señales del Dispositivo")
                .parent()
                .parent()
                .find("tbody tr")
                .should("contain", newSignalName);
              
              // Verificar que el nombre original ya no existe
              cy.get('[data-cy="devices-table"]')
                .contains("Señales del Dispositivo")
                .parent()
                .parent()
                .find("tbody tr")
                .should("not.contain", originalNameTrimmed);
            });
        });
    });

    it("Elimina una señal existente", () => {
      // Expandir fila
      cy.get('[data-cy="devices-table"]').within(() => {
        cy.get('[data-cy="expand-row-button"]').first().click();
      });

      cy.get("body").then(($body) => {
        if ($body.find('[data-cy="delete-signal-button"]').length > 0) {
          // Obtener nombre de la señal
          cy.get('[data-cy="devices-table"]')
            .contains("Señales del Dispositivo")
            .parent()
            .parent()
            .find("tbody tr")
            .first()
            .find("td")
            .eq(0)
            .invoke("text")
            .then((signalName) => {
              const signalNameToDelete = signalName.trim();

              // Eliminar señal
              cy.get('[data-cy="delete-signal-button"]').first().click({ force: true });

              cy.get('[data-cy="delete-signal-modal"]', { timeout: 10000 }).should("be.visible");
              cy.get('[data-cy="delete-signal-confirm-button"]').click();

              // Verificar que desapareció
              cy.get('[data-cy="delete-signal-modal"]', { timeout: 20000 }).should("not.exist");
              
              // Esperar a que termine la recarga
              cy.get(".animate-spin", { timeout: 5000 }).should("not.exist");
              cy.wait(2000); // Dar tiempo para que se complete la recarga

              // Colapsar la fila primero para forzar actualización
              cy.get('[data-cy="devices-table"]').within(() => {
                cy.get('[data-cy="expand-row-button"]').first().click();
                cy.wait(500);
              });

              // Expandir fila nuevamente para verificar
              cy.get('[data-cy="devices-table"]').within(() => {
                cy.get('[data-cy="expand-row-button"]').first().click();
                cy.wait(1000);
              });

              // Verificar que la señal ya no aparece
              cy.contains("Señales del Dispositivo", { timeout: 5000 }).should("be.visible");
              
              // Buscar dentro de la tabla de señales
              cy.get('[data-cy="devices-table"]')
                .contains("Señales del Dispositivo")
                .parent()
                .parent()
                .find("tbody tr")
                .should("not.contain", signalNameToDelete);
            });
        }
      });
    });
  });
});
